import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

/** Days in a row, earned by the best streak ever, so a badge stays once earned. */
const STREAK_BADGES = [3, 7, 14, 30, 40, 100, 365];
/** Dhikr counted in total. */
const TOTAL_BADGES = [1000, 10000, 100000, 1000000];

type Badge = { key: string; kind: 'streak' | 'total'; n: number; earned: boolean };

export function badgeList(bestStreak: number, allTime: number): Badge[] {
  return [
    ...STREAK_BADGES.map((n) => ({ key: `streak-${n}`, kind: 'streak' as const, n, earned: bestStreak >= n })),
    ...TOTAL_BADGES.map((n) => ({ key: `total-${n}`, kind: 'total' as const, n, earned: allTime >= n })),
  ];
}

/** Milestones for days in a row and for dhikr counted, with the next one to reach. */
export function Badges({ bestStreak, streak, allTime }: { bestStreak: number; streak: number; allTime: number }) {
  const theme = useTheme();
  const { t, formatNumber } = useI18n();
  const badges = badgeList(bestStreak, allTime);
  const earned = badges.filter((b) => b.earned).length;
  const nextStreak = STREAK_BADGES.find((n) => n > bestStreak);

  // Counts are shortened on the badge itself (10k, 1M) so every badge is the same size.
  const short = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n));

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('badgesEarned', { n: earned, total: badges.length })}
      </ThemedText>
      <View style={styles.grid}>
        {badges.map((b) => (
          <View
            key={b.key}
            accessibilityLabel={`${b.kind === 'streak' ? t('badgeStreak', { n: b.n }) : t('badgeTotal', { n: b.n })}${b.earned ? '' : ` (${t('locked')})`}`}
            style={[
              styles.badge,
              {
                borderColor: b.earned ? theme.accent : theme.border,
                backgroundColor: b.earned ? theme.accent : 'transparent',
                opacity: b.earned ? 1 : 0.5,
              },
            ]}>
            <ThemedText style={[styles.badgeNumber, { color: b.earned ? theme.onAccent : theme.textSecondary }]}>
              {b.kind === 'streak' ? formatNumber(b.n) : short(b.n)}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.badgeLabel, { color: b.earned ? theme.onAccent : theme.textSecondary }]}
              numberOfLines={1}>
              {b.kind === 'streak' ? t('badgeDays') : t('badgeDhikr')}
            </ThemedText>
          </View>
        ))}
      </View>
      {nextStreak ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('nextBadge', { n: nextStreak, left: nextStreak - streak })}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumber: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  badgeLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
