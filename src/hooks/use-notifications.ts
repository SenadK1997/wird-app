import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { REMINDERS } from '@/data/reminders';
import { useI18n } from '@/i18n';
import { useDhikrStore, type Reminder } from '@/store/dhikr-store';
import {
  onNotificationTap,
  syncNotifications,
  type NotificationConfig,
  type NudgeItem,
} from '@/utils/reminder';

type Overrides = Partial<Pick<NotificationConfig, 'reminders' | 'nudgesEnabled' | 'nudgesPerDay'>>;

/**
 * Returns a function that schedules all notifications from the current settings and language:
 * the user's own reminders plus the rotating verse/hadith nudges. Returns `false` when the
 * user has not allowed notifications.
 */
export function useNotificationSync() {
  const { reminders, dhikrRemindersEnabled, dhikrRemindersPerDay } = useDhikrStore();
  const { t, code } = useI18n();

  // Text is keyed only by language; recompute when the language changes, not on every render.
  const nudges = useMemo<NudgeItem[]>(
    () =>
      REMINDERS.map((r) => ({
        body: `${r.text[code]} — ${r.ref}`,
        dhikrId: r.target,
        salawat: r.theme === 'salawat',
      })),
    [code]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable for a given language
  const reminderText = useMemo(() => ({ title: t('notificationTitle'), body: t('notificationBody') }), [code]);

  return useCallback(
    (over: Overrides = {}) =>
      syncNotifications({
        reminders: over.reminders ?? reminders,
        reminderText,
        nudgeTitle: 'Wird',
        nudgesEnabled: over.nudgesEnabled ?? dhikrRemindersEnabled,
        nudgesPerDay: over.nudgesPerDay ?? dhikrRemindersPerDay,
        nudges,
      }),
    [reminders, dhikrRemindersEnabled, dhikrRemindersPerDay, nudges, reminderText]
  );
}

/**
 * Keeps the phone's notifications in step with the settings while the app is open, and opens
 * the right counter when a nudge is tapped. Mounted once the launch sequence is finished.
 */
export function NotificationSync({ active }: { active: boolean }) {
  const sync = useNotificationSync();
  const { onboarded, select } = useDhikrStore();

  // Reschedule on open and whenever the settings or language change.
  useEffect(() => {
    if (active && onboarded) sync().catch(() => {});
  }, [active, onboarded, sync]);

  // Tapping a nudge opens its counter. Keep the latest `select` without re-subscribing.
  const selectRef = useRef(select);
  selectRef.current = select;
  useEffect(() => {
    const sub = onNotificationTap((id) => {
      selectRef.current(id);
      router.navigate('/');
    });
    return () => sub.remove();
  }, []);

  return null;
}

/** For reuse by the settings screen when it only needs the type of a `Reminder`. */
export type { Reminder };
