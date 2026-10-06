import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { dayTotal, type History } from '@/store/dhikr-store';
import { dayKey, formatMonth, weekdayNames } from '@/utils/date';

type MonthCalendarProps = { history: History; goal: number | null };

/** One month at a time, each day marked by whether any dhikr was counted and the goal reached. */
export function MonthCalendar({ history, goal }: MonthCalendarProps) {
  const theme = useTheme();
  const { t, locale, rtl } = useI18n();
  const now = new Date();
  const [shown, setShown] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const first = new Date(shown.year, shown.month, 1);
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate();
  // Monday-first: getDay() is 0 for Sunday.
  const leading = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = dayKey(now);
  const isCurrentMonth = shown.year === now.getFullYear() && shown.month === now.getMonth();

  const shift = (by: number) => {
    const next = new Date(shown.year, shown.month + by, 1);
    setShown({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <NavButton symbol={rtl ? '›' : '‹'} label={t('previousMonth')} onPress={() => shift(-1)} />
        <ThemedText type="smallBold">{formatMonth(shown.year, shown.month, locale)}</ThemedText>
        <NavButton
          symbol={rtl ? '‹' : '›'}
          label={t('nextMonth')}
          disabled={isCurrentMonth}
          onPress={() => shift(1)}
        />
      </View>

      <View style={styles.week}>
        {weekdayNames(locale).map((name, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekday}>
            {name}
          </ThemedText>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} style={styles.week}>
          {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
            if (day === null) return <View key={i} style={styles.cell} />;
            const key = dayKey(new Date(shown.year, shown.month, day));
            const total = dayTotal(history[key]);
            const goalMet = goal !== null && total >= goal;
            return (
              <View key={i} style={styles.cell}>
                <View
                  style={[
                    styles.day,
                    total > 0 && { backgroundColor: theme.backgroundSelected },
                    goalMet && { backgroundColor: theme.accent },
                    key === todayKey && { borderColor: theme.text },
                  ]}>
                  <ThemedText type="small" style={goalMet && { color: theme.onAccent }}>
                    {day}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <LegendItem color={theme.backgroundSelected} label={t('legendSome')} />
        {goal !== null ? <LegendItem color={theme.accent} label={t('legendGoal')} /> : null}
      </View>
    </ThemedView>
  );
}

type NavButtonProps = { symbol: string; label: string; disabled?: boolean; onPress: () => void };

function NavButton({ symbol, label, disabled, onPress }: NavButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
      style={({ pressed }) => [styles.nav, pressed && styles.pressed, disabled && styles.disabled]}>
      <ThemedText style={styles.navSymbol}>{symbol}</ThemedText>
    </Pressable>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  nav: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSymbol: {
    fontSize: 24,
    lineHeight: 28,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.3,
  },
});
