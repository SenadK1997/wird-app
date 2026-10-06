import type { Reminder } from '@/store/dhikr-store';

// The web build has no scheduled notifications. Keeping the notifications library out of it
// altogether also keeps its "not supported on web" warnings out of the console.
export const remindersSupported = false;

export async function syncReminders(_reminders: Reminder[], _text: { title: string; body: string }) {
  return true;
}
