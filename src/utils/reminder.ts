import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/store/dhikr-store';

/** Scheduled notifications only exist in the phone app. */
export const remindersSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'daily-reminder';

if (remindersSupported) {
  // Show the reminder even if the app happens to be open when it fires.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function hasPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Makes the phone's schedule match the given reminders: one notification a day for each
 * enabled one. Returns `false` when the user has not allowed notifications.
 */
export async function syncReminders(reminders: Reminder[], text: { title: string; body: string }) {
  if (!remindersSupported) return true;
  const enabled = reminders.filter((reminder) => reminder.enabled);
  if (enabled.length === 0) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  }
  if (!(await hasPermission())) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of enabled) {
    await Notifications.scheduleNotificationAsync({
      content: text,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: CHANNEL_ID,
      },
    });
  }
  return true;
}
