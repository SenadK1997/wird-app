import { useEffect } from 'react';

import { currentStreak, dayTotal, MAX_FREEZES, useDhikrStore } from '@/store/dhikr-store';
import { dayKey } from '@/utils/date';

/** A freeze is earned on every 7th day in a row. */
const DAYS_PER_FREEZE = 7;

/**
 * Looks after streak freezes while the app is open. A missed day (or two) right before today is
 * covered by saved freezes, as long as there was a streak to keep; and reaching every 7th day in
 * a row earns one more. Renders nothing.
 */
export function StreakKeeper({ active }: { active: boolean }) {
  const {
    onboarded,
    history,
    frozenDays,
    streakFreezes,
    freezeAwardedOn,
    spendFreezes,
    awardFreeze,
    refundFreezes,
  } = useDhikrStore();

  useEffect(() => {
    if (!active || !onboarded) return;
    const isActive = (key: string) => dayTotal(history[key]) > 0 || frozenDays.includes(key);

    // A day a freeze covered that has dhikr after all (added by hand in History) gets it back.
    const covered = frozenDays.filter((day) => dayTotal(history[day]) > 0);
    if (covered.length > 0) {
      refundFreezes(covered);
      return;
    }

    // Missed days ending yesterday, newest first, stopping at the last day that kept the streak.
    if (streakFreezes > 0) {
      const missed: string[] = [];
      const day = new Date();
      day.setDate(day.getDate() - 1);
      while (missed.length <= MAX_FREEZES && !isActive(dayKey(day))) {
        missed.push(dayKey(day));
        day.setDate(day.getDate() - 1);
      }
      // Only when the gap is small enough to cover and a streak was running before it.
      if (missed.length > 0 && missed.length <= streakFreezes && isActive(dayKey(day))) {
        spendFreezes(missed);
        return;
      }
    }

    const today = dayKey();
    const streak = currentStreak(history, frozenDays);
    if (
      dayTotal(history[today]) > 0 &&
      streak > 0 &&
      streak % DAYS_PER_FREEZE === 0 &&
      freezeAwardedOn !== today &&
      streakFreezes < MAX_FREEZES
    ) {
      awardFreeze(today);
    }
  }, [
    active,
    onboarded,
    history,
    frozenDays,
    streakFreezes,
    freezeAwardedOn,
    spendFreezes,
    awardFreeze,
    refundFreezes,
  ]);

  return null;
}
