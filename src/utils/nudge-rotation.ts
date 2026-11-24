/**
 * Which verse or hadith each dhikr nudge shows.
 *
 * Every nudge slot gets a number counted from a fixed start (day number × nudges per day + slot),
 * and that number picks from the texts in a fixed shuffled order. So:
 * - each text comes once per round of all texts, with no repeats in between;
 * - the order mixes the themes instead of following the file, where they are grouped;
 * - rebuilding the schedule (every time the app opens) gives the same answer for the same slot,
 *   so opening the app never shows yesterday's texts again.
 */

/** Days since 1970 for the phone's local calendar date of `date`. */
export function localDayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

// Chosen so that, with the 46 texts in src/data/reminders.ts, no two neighbouring nudges share a
// theme (not even across the end of one round and the start of the next). If the texts change,
// the order is still a fair shuffle, just not guaranteed to alternate as neatly.
const SHUFFLE_SEED = 0x5769c525;
const orders = new Map<number, number[]>();

/** A fixed, random-looking order of 0..length-1 — the same on every phone and every launch. */
export function shuffledOrder(length: number): number[] {
  const cached = orders.get(length);
  if (cached) return cached;
  // mulberry32: a small seeded random generator, so the order never changes between launches.
  let seed = SHUFFLE_SEED;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  orders.set(length, order);
  return order;
}

/**
 * The text for slot `slot` (0-based) of local day `dayNumber`, when there are `perDay` slots a day.
 * On Fridays the last slot is a salawat, as the sunnah encourages, changing week by week.
 */
export function pickNudge<T extends { salawat: boolean }>(
  items: T[],
  dayNumber: number,
  slot: number,
  perDay: number,
  isFriday: boolean
): T {
  if (isFriday && slot === perDay - 1) {
    const salawat = items.filter((item) => item.salawat);
    if (salawat.length > 0) return salawat[Math.floor(dayNumber / 7) % salawat.length];
  }
  const index = (dayNumber * perDay + slot) % items.length;
  return items[shuffledOrder(items.length)[index]];
}
