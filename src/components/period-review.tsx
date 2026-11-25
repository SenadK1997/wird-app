import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { dayTotal, type History } from '@/store/dhikr-store';
import { dayKey, formatDay, formatMonth } from '@/utils/date';

const CHART_HEIGHT = 64;
const TOP_COUNT = 3;

type Period = { mode: 'month' | 'year'; year: number; month: number };

/** Reads "2026-11" (a month) or "2026" (a year), as sent by the review notifications. */
export function parsePeriod(value: string | undefined, now = new Date()): Period {
  const month = value?.match(/^(\d{4})-(\d{2})$/);
  if (month) return { mode: 'month', year: Number(month[1]), month: Number(month[2]) - 1 };
  const year = value?.match(/^(\d{4})$/);
  if (year) return { mode: 'year', year: Number(year[1]), month: 11 };
  return { mode: 'month', year: now.getFullYear(), month: now.getMonth() };
}

/** Every day key of a month, or of a year. */
function daysOf({ mode, year, month }: Period) {
  const keys: string[] = [];
  const first = new Date(year, mode === 'month' ? month : 0, 1);
  const end = mode === 'month' ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1);
  for (const d = first; d < end; d.setDate(d.getDate() + 1)) keys.push(dayKey(d));
  return keys;
}

function previous(p: Period): Period {
  if (p.mode === 'year') return { ...p, year: p.year - 1 };
  return p.month === 0 ? { ...p, year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 };
}

function next(p: Period): Period {
  if (p.mode === 'year') return { ...p, year: p.year + 1 };
  return p.month === 11 ? { ...p, year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 };
}

const isFuture = (p: Period, now = new Date()) =>
  p.year > now.getFullYear() ||
  (p.mode === 'month' && p.year === now.getFullYear() && p.month > now.getMonth());

type Props = {
  history: History;
  goal: number | null;
  /** Month or year to open on, e.g. from a review notification. */
  initial?: string;
  titleOf: (dhikrId: string) => string;
};

/** A month or a whole year at a glance: total, active days, best day, most recited, a chart. */
export function PeriodReview({ history, goal, initial, titleOf }: Props) {
  const theme = useTheme();
  const { t, locale, formatNumber } = useI18n();
  const [period, setPeriod] = useState<Period>(() => parsePeriod(initial));

  const keys = daysOf(period);
  const today = dayKey();
  const totals = keys.map((key) => dayTotal(history[key]));
  const total = totals.reduce((sum, n) => sum + n, 0);
  const active = totals.filter((n) => n > 0).length;
  // Days that can have happened yet, so the current month reads "12 of 25 days", not "of 30".
  const elapsed = keys.filter((key) => key <= today).length;
  const goalDays = goal === null ? 0 : totals.filter((n) => n >= goal).length;
  const best = totals.reduce((b, n, i) => (n > b.n ? { n, key: keys[i] } : b), { n: 0, key: '' });

  const before = daysOf(previous(period)).reduce((sum, key) => sum + dayTotal(history[key]), 0);
  const change = before > 0 ? Math.round(((total - before) / before) * 100) : null;

  const byDhikr: Record<string, number> = {};
  for (const key of keys) {
    for (const [id, n] of Object.entries(history[key] ?? {})) byDhikr[id] = (byDhikr[id] ?? 0) + n;
  }
  const top = Object.entries(byDhikr)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_COUNT);

  // The chart: one bar per day of the month, or per month of the year.
  const bars =
    period.mode === 'month'
      ? totals
      : Array.from({ length: 12 }, (_, m) =>
          keys.reduce((sum, key, i) => (Number(key.slice(5, 7)) === m + 1 ? sum + totals[i] : sum), 0)
        );
  const barMax = Math.max(1, ...bars);

  const label =
    period.mode === 'month' ? formatMonth(period.year, period.month, locale) : String(period.year);
  const canGoNext = !isFuture(next(period));

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.modes}>
        <Chip
          label={t('periodMonth')}
          selected={period.mode === 'month'}
          onPress={() => setPeriod(parsePeriod(undefined))}
        />
        <Chip
          label={t('periodYear')}
          selected={period.mode === 'year'}
          onPress={() => setPeriod({ mode: 'year', year: new Date().getFullYear(), month: 11 })}
        />
      </View>

      <View style={styles.header}>
        <Arrow label="‹" onPress={() => setPeriod(previous(period))} accessibilityLabel={t('previous')} />
        <ThemedText type="smallBold" style={styles.headerLabel}>
          {label}
        </ThemedText>
        <Arrow
          label="›"
          onPress={() => setPeriod(next(period))}
          disabled={!canGoNext}
          accessibilityLabel={t('next')}
        />
      </View>

      <View style={styles.totalLine}>
        <ThemedText style={styles.big}>{formatNumber(total)}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('dhikrCounted')}</ThemedText>
      </View>
      {change !== null ? (
        <ThemedText type="small" style={{ color: change >= 0 ? theme.accent : theme.textSecondary }}>
          {t(change >= 0 ? 'moreThanBefore' : 'lessThanBefore', { n: Math.abs(change) })}
        </ThemedText>
      ) : null}

      <View style={styles.chart}>
        {bars.map((n, i) => (
          <View key={i} style={styles.barSlot}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(2, (n / barMax) * CHART_HEIGHT),
                  backgroundColor: n > 0 ? theme.accent : theme.backgroundSelected,
                  opacity: n > 0 ? 1 : 0.6,
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.facts}>
        <Fact label={t('activeDays')} value={`${formatNumber(active)} / ${formatNumber(elapsed)}`} />
        {goal !== null ? <Fact label={t('goalReachedDays')} value={formatNumber(goalDays)} /> : null}
        <Fact
          label={t('bestDay')}
          value={best.n > 0 ? formatNumber(best.n) : '—'}
          note={best.n > 0 ? formatDay(best.key, locale) : undefined}
        />
      </View>

      {top.length > 0 ? (
        <View style={styles.top}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('mostRecited')}
          </ThemedText>
          {top.map(([id, n]) => (
            <View key={id} style={styles.row}>
              <ThemedText type="small" style={styles.rowLabel} numberOfLines={1}>
                {titleOf(id)}
              </ThemedText>
              <ThemedText type="small" style={styles.rowValue}>
                {formatNumber(n)}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {t('nothingInPeriod')}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function Arrow({
  label,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={Spacing.two}
      style={({ pressed }) => [styles.arrow, pressed && styles.pressed, disabled && styles.disabled]}>
      <ThemedText style={styles.arrowText}>{label}</ThemedText>
    </Pressable>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={styles.fact}>
      <ThemedText style={styles.factValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centered} numberOfLines={2}>
        {label}
      </ThemedText>
      {note ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          {note}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modes: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  arrow: {
    paddingHorizontal: Spacing.three,
  },
  arrowText: {
    fontSize: 26,
    lineHeight: 30,
  },
  totalLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  big: {
    fontFamily: AppFonts.bold,
    fontSize: 34,
    lineHeight: 42,
    fontVariant: ['tabular-nums'],
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
  },
  facts: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fact: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  factValue: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  centered: {
    textAlign: 'center',
  },
  top: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    fontVariant: ['tabular-nums'],
    fontFamily: AppFonts.bold,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.3,
  },
});
