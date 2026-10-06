import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdSlot } from '@/components/ad-slot';
import { Button } from '@/components/button';
import { MonthCalendar } from '@/components/month-calendar';
import { ProgressBar } from '@/components/progress-bar';
import { ShareDialog } from '@/components/share-dialog';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { bestStreak, currentStreak, dayTotal, useDhikrStore } from '@/store/dhikr-store';
import { dayKey, formatDay, lastDays } from '@/utils/date';
import { requestRating } from '@/utils/store';

/** Ask for a rating only once someone has used the app on a few days, and not again for months. */
const RATING_MIN_DAYS = 3;
const RATING_MIN_TOTAL = 100;
const RATING_REPEAT_DAYS = 120;

export default function HistoryScreen() {
  const theme = useTheme();
  const { t, locale, formatNumber, dhikrTitle } = useI18n();
  const { history, todayTotal, goal, reviewAskedOn, findDhikr, set } = useDhikrStore();
  const [sharing, setSharing] = useState(false);

  const days = lastDays(7);
  const todayEntries = Object.entries(history[days[0]] ?? {})
    .filter(([, taps]) => taps > 0)
    .sort(([, a], [, b]) => b - a);
  const streak = currentStreak(history);
  const allTime = Object.values(history).reduce((sum, totals) => sum + dayTotal(totals), 0);
  const activeDays = Object.values(history).filter((totals) => dayTotal(totals) > 0).length;

  // Looking at History is a calm moment; the counter is never interrupted with a rating prompt.
  useFocusEffect(
    useCallback(() => {
      if (activeDays < RATING_MIN_DAYS || allTime < RATING_MIN_TOTAL) return;
      const today = dayKey();
      if (reviewAskedOn) {
        const daysSince = (Date.parse(today) - Date.parse(reviewAskedOn)) / 86_400_000;
        if (daysSince < RATING_REPEAT_DAYS) return;
      }
      set({ reviewAskedOn: today });
      requestRating();
    }, [activeDays, allTime, reviewAskedOn, set])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{t('tabHistory')}</ThemedText>

          <View style={styles.stats}>
            <Stat label={t('today')} value={formatNumber(todayTotal)} />
            <Stat label={t('dayStreak')} value={formatNumber(streak)} />
          </View>
          <View style={styles.stats}>
            <Stat label={t('bestStreak')} value={formatNumber(bestStreak(history))} />
            <Stat label={t('allTime')} value={formatNumber(allTime)} />
          </View>

          {goal !== null ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <Row
                label={t(todayTotal >= goal ? 'dailyGoalReached' : 'dailyGoal')}
                value={t('countOfGoal', { count: todayTotal, goal })}
              />
              <ProgressBar progress={todayTotal / goal} />
            </ThemedView>
          ) : null}

          <Button label={t('share')} onPress={() => setSharing(true)} />

          <MonthCalendar history={history} goal={goal} />

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('today')}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            {todayEntries.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('noneToday')}</ThemedText>
            ) : (
              todayEntries.map(([id, taps]) => (
                <Row
                  key={id}
                  label={dhikrTitle(findDhikr(id) ?? { id, title: t('deletedDhikr') })}
                  value={formatNumber(taps)}
                />
              ))
            )}
          </ThemedView>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('last7')}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            {days.map((day, i) => {
              const total = dayTotal(history[day]);
              const goalMet = goal !== null && total >= goal;
              return (
                <Row
                  key={day}
                  label={i === 0 ? t('today') : formatDay(day, locale)}
                  value={
                    goalMet
                      ? `${formatNumber(total)} · ${t('goalReachedShort')}`
                      : formatNumber(total)
                  }
                  valueColor={goalMet ? theme.accent : undefined}
                />
              );
            })}
          </ThemedView>

          <AdSlot />
        </ScrollView>
      </SafeAreaView>

      <ShareDialog
        visible={sharing}
        count={todayTotal}
        streak={streak}
        onClose={() => setSharing(false)}
      />
    </ThemedView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.rowValue, valueColor !== undefined && { color: valueColor }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: AppFonts.bold,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    textAlign: 'center',
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
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
});
