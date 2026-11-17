import { useCallback } from 'react';

import { dayTotal, useDhikrStore } from '@/store/dhikr-store';
import { dayKey } from '@/utils/date';
import { requestRating } from '@/utils/store';

/**
 * Ask for a rating only once someone has had a few good days with the app (their daily goal
 * reached, or simply counted when they use no goal), and not again for months.
 */
const RATING_MIN_DAYS = 3;
const RATING_MIN_TOTAL = 100;
const RATING_REPEAT_DAYS = 120;

/**
 * Returns a function that shows the system's rating prompt when the time is right. Call it at a
 * calm moment, never in the middle of counting.
 */
export function useRatingPrompt() {
  const { history, goal, reviewAskedOn, set } = useDhikrStore();

  return useCallback(() => {
    const totals = Object.values(history).map(dayTotal);
    const allTime = totals.reduce((sum, n) => sum + n, 0);
    const goodDays = totals.filter((n) => (goal === null ? n > 0 : n >= goal)).length;
    if (goodDays < RATING_MIN_DAYS || allTime < RATING_MIN_TOTAL) return;

    const today = dayKey();
    if (reviewAskedOn) {
      const daysSince = (Date.parse(today) - Date.parse(reviewAskedOn)) / 86_400_000;
      if (daysSince < RATING_REPEAT_DAYS) return;
    }
    set({ reviewAskedOn: today });
    requestRating();
  }, [history, goal, reviewAskedOn, set]);
}
