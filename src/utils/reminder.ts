import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/store/dhikr-store';
import { localDayNumber, pickNudge } from '@/utils/nudge-rotation';

/** Scheduled notifications only exist in the phone app; reminder.web.ts is the web stand-in. */
export const remindersSupported = true;

const CHANNEL_CUSTOM = 'daily-reminder';
const CHANNEL_NUDGE = 'dhikr-reminders';
const CHANNEL_EXTRA = 'friday-and-reviews';
/** How many days of rotating nudges to schedule ahead. Rebuilt whenever the app opens. */
const NUDGE_DAYS = 14;
/** The hours of the day used for 1, 2 or 3 nudges — all in daytime, never at night. */
const SLOT_HOURS: Record<number, number[]> = { 1: [9], 2: [9, 20], 3: [9, 14, 20] };

/** One possible nudge: already localised text, and the counter it opens when tapped. */
export type NudgeItem = { body: string; dhikrId: string | null; salawat: boolean };

/**
 * A one-off notification at a set time: the Friday reminder, a month or year in review. Built
 * by the caller for the coming weeks, so the text is already in the user's language.
 */
export type ExtraNotification = {
  date: Date;
  title: string;
  body: string;
  data: NotificationTarget;
};

/** What tapping a notification opens. */
export type NotificationTarget = { dhikrId: string } | { open: 'history'; period: string };

export type NotificationConfig = {
  reminders: Reminder[];
  reminderText: { title: string; body: string };
  /** Title shown on every dhikr nudge (the app name). */
  nudgeTitle: string;
  nudgesEnabled: boolean;
  nudgesPerDay: number;
  nudges: NudgeItem[];
  extras: ExtraNotification[];
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
  const now = new Date();
  // Only what is still ahead; a slot about to pass is skipped.
  const extras = cfg.extras.filter((extra) => extra.date.getTime() > now.getTime() + 60_000);

  if (customEnabled.length === 0 && !wantNudges && extras.length === 0) {
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
    await Notifications.setNotificationChannelAsync(CHANNEL_EXTRA, {
      name: 'Friday and reviews',
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

  for (const extra of extras) {
    await Notifications.scheduleNotificationAsync({
      content: { title: extra.title, body: extra.body, data: extra.data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: extra.date,
        channelId: CHANNEL_EXTRA,
      },
    });
  }

  if (wantNudges) {
    const hours = SLOT_HOURS[Math.min(3, Math.max(1, cfg.nudgesPerDay))] ?? SLOT_HOURS[3];

    for (let d = 0; d < NUDGE_DAYS; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      const dayNumber = localDayNumber(day);
      const isFriday = day.getDay() === 5;

      for (let s = 0; s < hours.length; s++) {
        const when = new Date(day);
        when.setHours(hours[s], 0, 0, 0);
        // Skip a slot that is already past (or about to pass) today.
        if (when.getTime() <= now.getTime() + 60_000) continue;

        const item = pickNudge(cfg.nudges, dayNumber, s, hours.length, isFriday);

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
 * Calls `handler` with what to open when the user taps a notification. Returns a subscription.
 * Also handles the tap that opened the app from closed, which arrives before any listener exists.
 */
export function onNotificationTap(handler: (target: NotificationTarget) => void) {
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    // Handled once: otherwise the same tap would reopen the counter the next time this mounts.
    Notifications.clearLastNotificationResponse();
    const data = response.notification.request.content.data ?? {};
    if (typeof data.dhikrId === 'string') handler({ dhikrId: data.dhikrId });
    else if (data.open === 'history' && typeof data.period === 'string') {
      handler({ open: 'history', period: data.period });
    }
  };
  handle(Notifications.getLastNotificationResponse());
  return Notifications.addNotificationResponseReceivedListener(handle);
}
