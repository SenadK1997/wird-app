import Constants from 'expo-constants';
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

type Overrides = Partial<
  Pick<NotificationConfig, 'reminders' | 'nudgesEnabled' | 'nudgesPerDay' | 'ask'>
>;

/** The installed app version, e.g. "1.0.3". */
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

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
        // Changes made in Settings come from the user, so the phone may ask them.
        ask: over.ask ?? true,
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
  const { onboarded, notificationsAskedVersion, select, set } = useDhikrStore();

  // The store's actions are new on every change (every count), so read the latest from refs
  // rather than re-running the effects below each time.
  const actions = useRef({ select, set });
  useEffect(() => {
    actions.current = { select, set };
  }, [select, set]);

  // Reschedule on open and whenever the settings or language change. The first launch of each
  // app version (including the very first, right after the welcome screen) may ask to allow
  // notifications; every other launch only reschedules quietly.
  useEffect(() => {
    if (!active || !onboarded) return;
    const ask = notificationsAskedVersion !== APP_VERSION;
    // Saved before asking, so a settings change during the question does not ask a second time.
    if (ask) actions.current.set({ notificationsAskedVersion: APP_VERSION });
    sync({ ask }).catch(() => {});
  }, [active, onboarded, notificationsAskedVersion, sync]);

  // Tapping a nudge opens its counter.
  useEffect(() => {
    const sub = onNotificationTap((id) => {
      actions.current.select(id);
      router.navigate('/');
    });
    return () => sub.remove();
  }, []);

  return null;
}

/** For reuse by the settings screen when it only needs the type of a `Reminder`. */
export type { Reminder };
