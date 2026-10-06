import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarMark } from '@/components/star-mark';
import { LaunchColors, LaunchFonts } from '@/constants/launch-theme';
import { MaxContentWidth } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { LANGUAGES } from '@/i18n/languages';
import { useDhikrStore } from '@/store/dhikr-store';
import { layoutDirection } from '@/utils/direction';

const GOALS = [100, 300, 500, 1000];

/** First-launch screen: choose a language and a daily goal, then start. */
export function Welcome({ ready }: { ready: boolean }) {
  const { t, rtl, formatNumber } = useI18n();
  const { onboarded, language, dailyGoal, set } = useDhikrStore();
  // `null` means no daily goal.
  const [goal, setGoal] = useState<number | null>(dailyGoal);

  const handleStart = () => {
    set({
      onboarded: true,
      dailyGoalEnabled: goal !== null,
      ...(goal !== null ? { dailyGoal: goal } : {}),
    });
  };

  const quote = t('quote');

  return (
    // No onRequestClose handler: the Android back button must not skip the welcome screen.
    <Modal visible={ready && !onboarded} animationType="fade">
      <View style={[styles.container, layoutDirection(rtl)]}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.brand}>
              <StarMark />
              <Text style={styles.title}>{t('welcomeTitle')}</Text>
              <Text style={styles.tagline}>{t('welcomeTagline')}</Text>
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>{t('language')}</Text>
              <View style={styles.options}>
                <Option
                  label={t('followPhone')}
                  selected={language === 'system'}
                  onPress={() => set({ language: 'system' })}
                />
                {LANGUAGES.map((option) => (
                  <Option
                    key={option.code}
                    label={option.name}
                    selected={language === option.code}
                    onPress={() => set({ language: option.code })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>{t('dailyGoal')}</Text>
              <Text style={styles.hint}>{t('dailyGoalHint')}</Text>
              <View style={styles.options}>
                {GOALS.map((value) => (
                  <Option
                    key={value}
                    label={formatNumber(value)}
                    selected={goal === value}
                    onPress={() => setGoal(value)}
                  />
                ))}
                <Option label={t('noGoal')} selected={goal === null} onPress={() => setGoal(null)} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.verse}>أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ</Text>
              {quote ? <Text style={styles.cardText}>{quote}</Text> : null}
              <Text style={styles.reference}>Ar-Ra‘d 13:28</Text>
            </View>

            <Text style={styles.hint}>{t('welcomeFlows')}</Text>

            <Pressable
              onPress={handleStart}
              accessibilityRole="button"
              style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
              <Text style={styles.startLabel}>{t('start')}</Text>
            </Pressable>
            <Text style={[styles.hint, styles.centered]}>{t('welcomeChange')}</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

type OptionProps = { label: string; selected: boolean; onPress: () => void };

function Option({ label, selected, onPress }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: LaunchColors.background,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: LaunchFonts.display,
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
    color: LaunchColors.text,
  },
  tagline: {
    fontFamily: LaunchFonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: LaunchColors.textMuted,
  },
  group: {
    gap: 8,
  },
  label: {
    fontFamily: LaunchFonts.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: LaunchColors.textSoft,
  },
  hint: {
    fontFamily: LaunchFonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: LaunchColors.textMuted,
  },
  centered: {
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LaunchColors.border,
    backgroundColor: LaunchColors.surface,
  },
  optionSelected: {
    borderColor: LaunchColors.accent,
    backgroundColor: LaunchColors.accent,
  },
  optionLabel: {
    fontFamily: LaunchFonts.bodyMedium,
    fontSize: 15,
    color: LaunchColors.text,
  },
  optionLabelSelected: {
    color: LaunchColors.onAccent,
  },
  card: {
    borderWidth: 1,
    borderColor: LaunchColors.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  verse: {
    fontFamily: LaunchFonts.arabic,
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'center',
    color: LaunchColors.textSoft,
    writingDirection: 'rtl',
  },
  cardText: {
    fontFamily: LaunchFonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: LaunchColors.textMuted,
  },
  reference: {
    fontFamily: LaunchFonts.body,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: LaunchColors.textFaint,
  },
  start: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: LaunchColors.accent,
  },
  startLabel: {
    fontFamily: LaunchFonts.bodySemiBold,
    fontSize: 17,
    color: LaunchColors.onAccent,
  },
  pressed: {
    opacity: 0.75,
  },
});
