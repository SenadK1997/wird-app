import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/store/dhikr-store';

/** Scheduled notifications only exist in the phone app; reminder.web.ts is the web stand-in. */
export const remindersSupported = true;

const CHANNEL_CUSTOM = 'daily-reminder';
const CHANNEL_NUDGE = 'dhikr-reminders';
/** How many days of rotating nudges to schedule ahead. Rebuilt whenever the app opens. */
const NUDGE_DAYS = 14;
/** The hours of the day used for 1, 2 or 3 nudges — all in daytime, never at night. */
const SLOT_HOURS: Record<number, number[]> = { 1: [9], 2: [9, 20], 3: [9, 14, 20] };

/** One possible nudge: already localised text, and the counter it opens when tapped. */
export type NudgeItem = { body: string; dhikrId: string | null; salawat: boolean };

export type NotificationConfig = {
  reminders: Reminder[];
  reminderText: { title: string; body: string };
  /** Title shown on every dhikr nudge (the app name). */
  nudgeTitle: string;
  nudgesEnabled: boolean;
  nudgesPerDay: number;
  nudges: NudgeItem[];
  /**
   * Whether the phone may show its "Allow notifications?" question if it has not been answered
   * with a yes. Off for the quiet reschedule on every launch, so nobody is asked every time.
   */
  ask: boolean;
};

// Show the notification even if the app happens to be open when it fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensurePermission(ask: boolean) {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!ask || !current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Makes the phone's schedule match the settings: the user's own daily reminders, plus the
 * rotating dhikr nudges (a verse or hadith a few times a day). Returns `false` when the user
 * has not allowed notifications.
 */
export function syncNotifications(cfg: NotificationConfig): Promise<boolean> {
  // One at a time: two overlapping runs could each clear and then both add, doubling every nudge.
  const run = queue.then(() => scheduleAll(cfg));
  queue = run.catch(() => {});
  return run;
}

let queue: Promise<unknown> = Promise.resolve();

async function scheduleAll(cfg: NotificationConfig): Promise<boolean> {
  const customEnabled = cfg.reminders.filter((r) => r.enabled);
  const wantNudges = cfg.nudgesEnabled && cfg.nudges.length > 0;

  if (customEnabled.length === 0 && !wantNudges) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  }
  if (!(await ensurePermission(cfg.ask))) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_CUSTOM, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(CHANNEL_NUDGE, {
      name: 'Dhikr reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of customEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: cfg.reminderText,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: CHANNEL_CUSTOM,
      },
    });
  }

  if (wantNudges) {
    const hours = SLOT_HOURS[Math.min(3, Math.max(1, cfg.nudgesPerDay))] ?? SLOT_HOURS[3];
    const salawat = cfg.nudges.filter((n) => n.salawat);
    const now = new Date();
    // Rotate the starting point each day, so the first nudge is not always the same.
    let idx = Math.floor(now.getTime() / 86_400_000) % cfg.nudges.length;
    let salawatIdx = 0;

    for (let d = 0; d < NUDGE_DAYS; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      const isFriday = day.getDay() === 5;

      for (let s = 0; s < hours.length; s++) {
        const when = new Date(day);
        when.setHours(hours[s], 0, 0, 0);
        // Skip a slot that is already past (or about to pass) today.
        if (when.getTime() <= now.getTime() + 60_000) continue;

        // On Fridays the last nudge is a salawat, as the sunnah encourages.
        const item =
          isFriday && s === hours.length - 1 && salawat.length > 0
            ? salawat[salawatIdx++ % salawat.length]
            : cfg.nudges[idx++ % cfg.nudges.length];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: cfg.nudgeTitle,
            body: item.body,
            data: item.dhikrId ? { dhikrId: item.dhikrId } : {},
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            channelId: CHANNEL_NUDGE,
          },
        });
      }
    }
  }

  return true;
}

/**
 * Calls `handler` with the dhikr id when the user taps a nudge. Returns a subscription.
 * Also handles the tap that opened the app from closed, which arrives before any listener exists.
 */
export function onNotificationTap(handler: (dhikrId: string) => void) {
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    // Handled once: otherwise the same tap would reopen the counter the next time this mounts.
    Notifications.clearLastNotificationResponse();
    const id = response.notification.request.content.data?.dhikrId;
    if (typeof id === 'string') handler(id);
  };
  handle(Notifications.getLastNotificationResponse());
  return Notifications.addNotificationResponseReceivedListener(handle);
}
