import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { REMINDERS } from '@/data/reminders';
import { useI18n, type Translate } from '@/i18n';
import { useDhikrStore, type Reminder } from '@/store/dhikr-store';
import { formatMonth } from '@/utils/date';
import {
  onNotificationTap,
  syncNotifications,
  type ExtraNotification,
  type NotificationConfig,
  type NudgeItem,
} from '@/utils/reminder';

type Overrides = Partial<
  Pick<NotificationConfig, 'reminders' | 'nudgesEnabled' | 'nudgesPerDay' | 'ask'>
> & { jumaEnabled?: boolean; reviewNotifications?: boolean };

/** The installed app version, e.g. "1.0.3". */
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

/** Fridays ahead to schedule; rebuilt each time the app opens. */
const FRIDAYS_AHEAD = 4;
const JUMA_HOUR = 10;
/** The month and year reviews arrive on the evening of the last day. */
const REVIEW_HOUR = 21;

/** Friday reminders for the coming weeks, at mid-morning. Tapping one opens the salawat counter. */
export function fridayReminders(t: Translate, from = new Date()): ExtraNotification[] {
  const out: ExtraNotification[] = [];
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate(), JUMA_HOUR);
  while (out.length < FRIDAYS_AHEAD) {
    if (day.getDay() === 5) {
      out.push({ date: new Date(day), title: t('jumaTitle'), body: t('jumaBody'), data: { dhikrId: 'salawat' } });
    }
    day.setDate(day.getDate() + 1);
  }
  return out;
}

/**
 * A look back on the last evening of this month and the next. On 31 December it is the year
 * instead. Tapping one opens History on that month or year.
 */
export function reviewReminders(t: Translate, locale: string, from = new Date()): ExtraNotification[] {
  return [0, 1].map((ahead) => {
    const year = from.getFullYear() + Math.floor((from.getMonth() + ahead) / 12);
    const month = (from.getMonth() + ahead) % 12;
    // Day 0 of the next month is the last day of this one.
    const date = new Date(year, month + 1, 0, REVIEW_HOUR);
    if (month === 11) {
      return {
        date,
        title: t('yearReviewTitle', { year: String(year) }),
        body: t('yearReviewBody'),
        data: { open: 'history', period: String(year) },
      };
    }
    const name = formatMonth(year, month, locale);
    return {
      date,
      title: t('monthReviewTitle', { month: name }),
      body: t('monthReviewBody'),
      data: { open: 'history', period: `${year}-${String(month + 1).padStart(2, '0')}` },
    };
  });
}

/**
 * Returns a function that schedules all notifications from the current settings and language:
 * the user's own reminders, the rotating verse/hadith nudges, Friday and the month/year reviews.
 * Returns `false` when the user has not allowed notifications.
 */
export function useNotificationSync() {
  const { reminders, dhikrRemindersEnabled, dhikrRemindersPerDay, jumaEnabled, reviewNotifications } =
    useDhikrStore();
  const { t, code, locale } = useI18n();

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
        extras: [
          ...((over.jumaEnabled ?? jumaEnabled) ? fridayReminders(t) : []),
          ...((over.reviewNotifications ?? reviewNotifications) ? reviewReminders(t, locale) : []),
        ],
        // Changes made in Settings come from the user, so the phone may ask them.
        ask: over.ask ?? true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t and locale follow code
    [reminders, dhikrRemindersEnabled, dhikrRemindersPerDay, jumaEnabled, reviewNotifications, nudges, reminderText, code]
  );
}

/**
 * Keeps the phone's notifications in step with the settings while the app is open, and opens
 * the right screen when one is tapped. Mounted once the launch sequence is finished.
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

  // A nudge or the Friday reminder opens its counter; a review opens History on that period.
  useEffect(() => {
    const sub = onNotificationTap((target) => {
      if ('dhikrId' in target) {
        actions.current.select(target.dhikrId);
        router.navigate('/');
      } else {
        router.navigate({ pathname: '/history', params: { period: target.period } });
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}

/** For reuse by the settings screen when it only needs the type of a `Reminder`. */
export type { Reminder };
