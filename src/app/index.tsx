import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConfirm } from '@/components/confirm-dialog';
import { ProgressBar } from '@/components/progress-bar';
import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTapSound } from '@/hooks/use-tap-sound';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';

const KEEP_AWAKE_TAG = 'counter';
/** Arabic longer than this is a full dua rather than a short phrase, and gets smaller type. */
const LONG_ARABIC = 40;
/** Longer still (a whole verse or surah) gets the smallest type so it needs less scrolling. */
const VERY_LONG_ARABIC = 140;

export default function CounterScreen() {
  const theme = useTheme();
  const confirm = useConfirm();
  const playTap = useTapSound();
  const { t, meaning, flowTitle } = useI18n();
  const {
    selected,
    count,
    target,
    activeFlow,
    todayTotal,
    goal,
    hapticsEnabled,
    soundEnabled,
    keepAwake,
    display,
    increment,
    undo,
    reset,
    exitFlow,
  } = useDhikrStore();
  const { width, height } = useWindowDimensions();
  const ringSize = Math.max(180, Math.min(width - Spacing.six * 2, height * 0.34, 320));

  // Keep the phone from locking mid-count, but only while this screen is the one showing.
  useFocusEffect(
    useCallback(() => {
      if (!keepAwake) return;
      // Not every device or browser supports a wake lock.
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
      };
    }, [keepAwake])
  );

  const rounds = Math.floor(count / target);
  const inRound = count % target;
  // A just-completed round shows as full (33 / 33) until the next tap starts a new one.
  const shown = count > 0 && inRound === 0 ? target : inRound;

  const arabicLength = selected.arabic?.length ?? 0;
  const long = arabicLength > LONG_ARABIC;
  const arabicStyle =
    arabicLength > VERY_LONG_ARABIC ? styles.arabicVeryLong : long ? styles.arabicLong : styles.arabic;
  const translation = meaning(selected.id);
  const flowName = activeFlow ? flowTitle(activeFlow.flow) : '';

  const handleTap = () => {
    if (activeFlow?.done) return;
    increment();
    if (soundEnabled) playTap();
    if (!hapticsEnabled) return;
    const completesRound = (count + 1) % target === 0;
    const feedback = completesRound
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Not every device or browser can vibrate.
    feedback.catch(() => {});
  };

  const handleReset = () => {
    if (activeFlow) {
      confirm({
        title: t('restart'),
        message: t('restartMessage', { title: flowName }),
        actionLabel: t('restart'),
        onConfirm: reset,
      });
    } else {
      confirm({
        title: t('resetTitle'),
        message: t('resetMessage', { title: selected.title }),
        actionLabel: t('reset'),
        onConfirm: reset,
      });
    }
  };

  const canUndo = count > 0 || (activeFlow !== null && activeFlow.step > 1);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {activeFlow ? (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={[styles.centered, { color: theme.onAccent }]}>
              {t('flowStep', { title: flowName, step: activeFlow.step, steps: activeFlow.steps })}
            </ThemedText>
          </View>
        ) : null}

        {/* Scrolls when a long dua does not fit, so the ring always stays on screen. */}
        <ScrollView style={styles.header} contentContainerStyle={styles.headerContent}>
          {display.arabic && selected.arabic ? (
            <ThemedText style={arabicStyle}>{selected.arabic}</ThemedText>
          ) : null}
          {display.transliteration ? (
            <ThemedText
              type={long ? 'smallBold' : 'subtitle'}
              style={long ? styles.centered : styles.title}>
              {selected.transliteration ?? selected.title}
            </ThemedText>
          ) : null}
          {display.translation && translation ? (
            <ThemedText
              type={long ? 'small' : 'default'}
              themeColor="textSecondary"
              style={styles.centered}>
              {translation}
            </ThemedText>
          ) : null}
          {display.source && selected.source ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
              {selected.source}
            </ThemedText>
          ) : null}
        </ScrollView>

        <Pressable
          onPress={handleTap}
          accessibilityRole="button"
          accessibilityLabel={t('countLabel', { title: selected.title })}
          accessibilityValue={{ text: `${shown} / ${target}` }}
          style={({ pressed }) => pressed && styles.ringPressed}>
          <ProgressRing size={ringSize} progress={shown / target}>
            <ThemedText style={styles.count}>{shown}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('ofTarget', { n: target })}</ThemedText>
          </ProgressRing>
        </Pressable>

        <View style={styles.status}>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {activeFlow
              ? activeFlow.done
                ? t('flowDone', { title: flowName })
                : t('flowNext')
              : t('rounds', { n: rounds })}
          </ThemedText>

          {goal !== null ? (
            <View style={styles.goal}>
              <ProgressBar progress={todayTotal / goal} />
              <ThemedText
                type="small"
                themeColor={todayTotal >= goal ? undefined : 'textSecondary'}
                style={[styles.centered, todayTotal >= goal && { color: theme.accent }]}>
                {t(todayTotal >= goal ? 'goalReachedProgress' : 'todayProgress', {
                  count: todayTotal,
                  goal,
                })}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <ActionButton label={t('undo')} onPress={undo} disabled={!canUndo} />
          <ActionButton
            label={t(activeFlow ? 'restart' : 'reset')}
            onPress={handleReset}
            disabled={!canUndo}
          />
          {activeFlow ? <ActionButton label={t('exit')} onPress={exitFlow} /> : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

type ActionButtonProps = { label: string; onPress: () => void; disabled?: boolean };

function ActionButton({ label, onPress, disabled }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
      <ThemedView type="backgroundElement" style={styles.actionButton}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
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
    paddingHorizontal: Spacing.four,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    flexGrow: 0,
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  headerContent: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  arabic: {
    fontSize: 40,
    lineHeight: 64,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arabicLong: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arabicVeryLong: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  count: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  ringPressed: {
    transform: [{ scale: 0.97 }],
  },
  status: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.two,
  },
  goal: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  actionButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
