/** Local calendar day as `YYYY-MM-DD`, used as the history key. */
export function dayKey(date: Date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The last `count` day keys, today first. */
export function lastDays(count: number, from: Date = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() - i);
    return dayKey(date);
  });
}

export function formatTime(hour: number, minute: number, locale?: string) {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDay(key: string, locale?: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatMonth(year: number, month: number, locale?: string) {
  return new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/** Short weekday names, Monday first. */
export function weekdayNames(locale?: string) {
  // 1 January 2024 was a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' })
  );
}
