import type { Reminder } from '@/store/dhikr-store';

// The web build has no scheduled notifications. Keeping the notifications library out of it
// altogether also keeps its "not supported on web" warnings out of the console.
export const remindersSupported = false;

export type NudgeItem = { body: string; dhikrId: string | null; salawat: boolean };

export type NotificationConfig = {
  reminders: Reminder[];
  reminderText: { title: string; body: string };
  nudgeTitle: string;
  nudgesEnabled: boolean;
  nudgesPerDay: number;
  nudges: NudgeItem[];
  ask: boolean;
};

export async function syncNotifications(_cfg: NotificationConfig) {
  return true;
}

export function onNotificationTap(_handler: (dhikrId: string) => void) {
  return { remove() {} };
}
