import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from '@/components/ad-banner';
import { AddCountDialog } from '@/components/add-count-dialog';
import { Button } from '@/components/button';
import { MonthCalendar } from '@/components/month-calendar';
import { ProgressRing } from '@/components/progress-ring';
import { ShareDialog } from '@/components/share-dialog';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { FREE_COUNTER, type Dhikr } from '@/data/dhikr';
import { useRatingPrompt } from '@/hooks/use-rating-prompt';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { bestStreak, currentStreak, dayTotal, useDhikrStore, type History } from '@/store/dhikr-store';
import { dayKey, formatDay, lastDays } from '@/utils/date';

/** How many dhikr the "Most recited" list shows. */
const TOP_COUNT = 5;
const CHART_HEIGHT = 96;

/** Taps per dhikr id over all of history, highest first. */
function totalsById(history: History) {
  const totals: Record<string, number> = {};
  for (const day of Object.values(history)) {
    for (const [id, taps] of Object.entries(day)) totals[id] = (totals[id] ?? 0) + taps;
  }
  return Object.entries(totals)
    .filter(([, taps]) => taps > 0)
    .sort(([, a], [, b]) => b - a);
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { t, locale, formatNumber, dhikrTitle } = useI18n();
  const { history, todayTotal, goal, findDhikr, suggested, custom, selected, lastAdd, addCount, undoAdd } =
    useDhikrStore();
  const [sharing, setSharing] = useState(false);
  const [adding, setAdding] = useState(false);
  const todayKey = dayKey();
  const [day, setDay] = useState(todayKey);
  const askForRating = useRatingPrompt();

  // Looking at History is a calm moment to ask for a rating.
  useFocusEffect(
    useCallback(() => {
      askForRating();
    }, [askForRating])
  );

  const streak = currentStreak(history);
  const best = bestStreak(history);
  const ranked = totalsById(history);
  const allTime = ranked.reduce((sum, [, taps]) => sum + taps, 0);
  const titleOf = (id: string) => dhikrTitle(findDhikr(id) ?? { id, title: t('deletedDhikr') });

  // This week, oldest first, so today sits on the right like a timeline.
  const week = lastDays(7).reverse().map((key) => ({ key, total: dayTotal(history[key]) }));
  const weekTotal = week.reduce((sum, d) => sum + d.total, 0);
  const goalDays = goal === null ? 0 : week.filter((d) => d.total >= goal).length;
  const chartMax = Math.max(1, goal ?? 0, ...week.map((d) => d.total));

  const dayEntries = Object.entries(history[day] ?? {})
    .filter(([, taps]) => taps > 0)
    .sort(([, a], [, b]) => b - a);
  const dayLabel = day === todayKey ? t('today') : formatDay(day, locale);

  // For adding to a day: what was counted that day, then the most recited, then everything else.
  const choices: Dhikr[] = [];
  const seen = new Set<string>();
  const offer = (d: Dhikr | undefined) => {
    if (d && d.id !== FREE_COUNTER.id && !seen.has(d.id)) {
      seen.add(d.id);
      choices.push(d);
    }
  };
  dayEntries.forEach(([id]) => offer(findDhikr(id)));
  offer(selected);
  ranked.forEach(([id]) => offer(findDhikr(id)));
  [...custom, ...suggested].forEach(offer);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{t('tabHistory')}</ThemedText>

          {/* Today at a glance */}
          <ThemedView type="backgroundElement" style={[styles.card, styles.today]}>
            {goal !== null ? (
              <ProgressRing size={92} strokeWidth={9} progress={todayTotal / goal}>
                <ThemedText style={styles.ringText}>
                  {formatNumber(Math.min(100, Math.floor((todayTotal / goal) * 100)))}%
                </ThemedText>
              </ProgressRing>
            ) : null}
            <View style={styles.todayText}>
              <View style={styles.todayLine}>
                <ThemedText style={styles.big}>{formatNumber(todayTotal)}</ThemedText>
                <ThemedText themeColor="textSecondary">{t('today')}</ThemedText>
              </View>
              {goal !== null ? (
                <ThemedText
                  type="smallBold"
                  style={todayTotal >= goal ? { color: theme.accent } : undefined}
                  themeColor={todayTotal >= goal ? undefined : 'textSecondary'}>
                  {todayTotal >= goal
                    ? t('dailyGoalReached')
                    : t('countOfGoal', { count: todayTotal, goal })}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {t('streakBest', { n: streak, best })}
              </ThemedText>
            </View>
          </ThemedView>

          {/* This week */}
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('last7')}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.chart}>
              {goal !== null && goal <= chartMax ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.goalLine,
                    { bottom: (goal / chartMax) * CHART_HEIGHT, borderColor: theme.accent },
                  ]}
                />
              ) : null}
              {week.map(({ key, total }) => {
                const met = goal !== null && total >= goal;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setDay(key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDay(key, locale)}: ${formatNumber(total)}`}
                    style={styles.barSlot}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (total / chartMax) * CHART_HEIGHT),
                          backgroundColor: met
                            ? theme.accent
                            : total > 0
                              ? theme.textSecondary
                              : theme.backgroundSelected,
                          opacity: met || total === 0 ? 1 : 0.55,
                        },
                        key === day && { borderWidth: 2, borderColor: theme.text },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.barLabels}>
              {week.map(({ key }) => {
                const [y, m, d] = key.split('-').map(Number);
                return (
                  <ThemedText
                    key={key}
                    type={key === todayKey ? 'smallBold' : 'small'}
                    themeColor={key === todayKey ? undefined : 'textSecondary'}
                    style={styles.barLabel}>
                    {new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'narrow' })}
                  </ThemedText>
                );
              })}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('weekSummary', { count: weekTotal })}
              {goal !== null ? ` · ${t('goalDays', { n: goalDays })}` : ''}
            </ThemedText>
          </ThemedView>

          {/* Calendar and the chosen day */}
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('calendar')}
          </ThemedText>
          <MonthCalendar history={history} goal={goal} selected={day} onSelect={setDay} />

          <ThemedView
            type="backgroundElement"
            style={[styles.card, { borderWidth: 1, borderColor: theme.accent }]}>
            <View style={styles.row}>
              <ThemedText type="smallBold" style={styles.rowLabel}>
                {dayLabel}
              </ThemedText>
              <ThemedText style={styles.rowValue}>{formatNumber(dayTotal(history[day]))}</ThemedText>
            </View>
            {dayEntries.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {day === todayKey ? t('noneToday') : t('noneDay')}
              </ThemedText>
            ) : (
              dayEntries.map(([id, taps]) => (
                <View key={id} style={styles.row}>
                  <ThemedText type="small" style={styles.rowLabel} numberOfLines={1}>
                    {titleOf(id)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.rowValue}>
                    {formatNumber(taps)}
                  </ThemedText>
                </View>
              ))
            )}
            {lastAdd && lastAdd.day === day ? (
              <View style={styles.row}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
                  {t('addedLine', { count: lastAdd.amount, title: titleOf(lastAdd.id) })}
                </ThemedText>
                <Pressable onPress={undoAdd} accessibilityRole="button" hitSlop={Spacing.two}>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {t('undo')}
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
            <Button label={`+ ${t('addForDay')}`} onPress={() => setAdding(true)} />
          </ThemedView>

          {/* Most recited */}
          {ranked.length > 0 ? (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                {t('mostRecited')}
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.card}>
                {ranked.slice(0, TOP_COUNT).map(([id, taps]) => (
                  <View key={id} style={styles.topItem}>
                    <View style={styles.row}>
                      <ThemedText type="small" style={styles.rowLabel} numberOfLines={1}>
                        {titleOf(id)}
                      </ThemedText>
                      <ThemedText type="small" style={styles.rowValue}>
                        {formatNumber(taps)}
                      </ThemedText>
                    </View>
                    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${(taps / ranked[0][1]) * 100}%`, backgroundColor: theme.accent },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </ThemedView>
            </>
          ) : null}

          {/* All time */}
          <View style={styles.stats}>
            <Stat label={t('allTime')} value={formatNumber(allTime)} />
            <Stat label={t('bestStreak')} value={formatNumber(best)} />
          </View>
          <Button label={t('share')} onPress={() => setSharing(true)} />
        </ScrollView>
        <AdBanner />
      </SafeAreaView>

      <ShareDialog visible={sharing} count={todayTotal} streak={streak} onClose={() => setSharing(false)} />
      <AddCountDialog
        visible={adding}
        choices={choices}
        day={{ key: day, label: dayLabel }}
        onAdd={({ amount, dhikrId }) => addCount(amount, { day, dhikrId })}
        onClose={() => setAdding(false)}
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  ringText: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  todayText: {
    flex: 1,
    gap: Spacing.half,
  },
  todayLine: {
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
  sectionLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.three,
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: Spacing.one,
  },
  barLabels: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  barLabel: {
    flex: 1,
    textAlign: 'center',
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
  topItem: {
    gap: Spacing.one,
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
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
});
