import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';
import { dayKey } from '@/utils/date';

export const SALAWAT_ID = 'salawat';

/** Friday only: today's salawat against the Friday goal, and a reminder of Surah al-Kahf. */
export function JumaCard({ onCount, style }: { onCount: () => void; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { jumaEnabled, jumaSalawatGoal, history } = useDhikrStore();

  if (!jumaEnabled || new Date().getDay() !== 5) return null;

  const done = history[dayKey()]?.[SALAWAT_ID] ?? 0;
  const reached = done >= jumaSalawatGoal;

  return (
    <View style={style}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.accent }]}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {t('jumaTitle')}
        </ThemedText>
        <ThemedText type="small">
          {reached
            ? t('jumaSalawatDone', { count: done })
            : t('jumaSalawatProgress', { count: done, goal: jumaSalawatGoal })}
        </ThemedText>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(100, (done / jumaSalawatGoal) * 100)}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {t('jumaKahf')}
        </ThemedText>
        <Button label={t('jumaCount')} onPress={onCount} variant={reached ? 'secondary' : 'primary'} />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
