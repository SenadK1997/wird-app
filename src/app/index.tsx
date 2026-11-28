import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddCountDialog } from '@/components/add-count-dialog';
import { useConfirm } from '@/components/confirm-dialog';
import { ProgressBar } from '@/components/progress-bar';
import { ProgressRing } from '@/components/progress-ring';
import { ScrollArea } from '@/components/scroll-area';
import { ShareDialog } from '@/components/share-dialog';
import { ThemePattern } from '@/components/theme-pattern';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { FREE_COUNTER_ID } from '@/data/dhikr';
import { useRatingPrompt } from '@/hooks/use-rating-prompt';
import { useTapSound } from '@/hooks/use-tap-sound';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { currentStreak, useDhikrStore } from '@/store/dhikr-store';

const KEEP_AWAKE_TAG = 'counter';
/** Arabic longer than this is a full dua rather than a short phrase, and gets smaller type. */
const LONG_ARABIC = 40;
/** Longer still (a whole verse or surah) gets the smallest type so it needs less scrolling. */
const VERY_LONG_ARABIC = 140;
/** Text longer than this (a custom dua typed in full) gets smaller type too. */
const LONG_TEXT = 80;

export default function CounterScreen() {
  const theme = useTheme();
  const confirm = useConfirm();
  const playTap = useTapSound();
  const { t, meaning, flowTitle, dhikrTitle, dhikrText } = useI18n();
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
    history,
    frozenDays,
    themePack,
    increment,
    undo,
    addCount,
    reset,
    exitFlow,
    findDhikr,
  } = useDhikrStore();
  // The ring gives a small press on every tap and glows once when a round is complete.
  const [press] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));
  const [addVisible, setAddVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
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

  // Leaving the counter right after reaching the daily goal is a good moment to ask for a rating.
  // Read through a ref, so counting itself never triggers the check.
  const askForRating = useRatingPrompt();
  const leaveCheck = useRef(() => {});
  useEffect(() => {
    leaveCheck.current = () => {
      if (goal !== null && todayTotal >= goal) askForRating();
    };
  }, [goal, todayTotal, askForRating]);
  useFocusEffect(
    useCallback(() => {
      return () => leaveCheck.current();
    }, [])
  );

  // A target of 0 is the free counter: it counts up for ever, with no rounds and no text.
  const endless = target === 0;
  const rounds = endless ? 0 : Math.floor(count / target);
  const inRound = endless ? count : count % target;
  // A just-completed round shows as full (33 / 33) until the next tap starts a new one.
  const shown = !endless && count > 0 && inRound === 0 ? target : inRound;
  const title = dhikrTitle(selected);

  const text = dhikrText(selected);
  const translation = meaning(selected.id);
  const showArabic = display.arabic && !!selected.arabic;
  const showTranslation = display.translation && !!translation;
  // The Latin text is shown once: when its line is on, or when none of this dhikr's words would
  // be visible otherwise (a custom dhikr written only in Latin letters has no Arabic and no
  // translation). Every line switched off still gives the plain counter.
  const anyLineOn = display.arabic || display.transliteration || display.translation;
  const showText =
    selected.id !== FREE_COUNTER_ID &&
    (display.transliteration || (anyLineOn && !showArabic && !showTranslation));
  const arabicLength = selected.arabic?.length ?? 0;
  const long =
    arabicLength > LONG_ARABIC || text.length > LONG_TEXT;
  const arabicStyle =
    arabicLength > VERY_LONG_ARABIC ? styles.arabicVeryLong : long ? styles.arabicLong : styles.arabic;
  const flowName = activeFlow ? flowTitle(activeFlow.flow) : '';
  // In a flow, the dhikr that comes after this one (activeFlow.step counts from 1).
  const nextStep = activeFlow ? activeFlow.flow.steps[activeFlow.step] : undefined;
  const nextDhikr = nextStep ? findDhikr(nextStep.dhikrId) : undefined;
  const upNext = nextStep && nextDhikr ? { dhikr: nextDhikr, target: nextStep.target } : null;

  const handleTap = () => {
    if (activeFlow?.done) return;
    increment();
    if (soundEnabled) playTap();
    const completesRound = !endless && (count + 1) % target === 0;
    press.setValue(0.965);
    Animated.spring(press, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }).start();
    if (completesRound) {
      glow.setValue(0);
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
    if (!hapticsEnabled) return;
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
        message: t('resetMessage', { title }),
        actionLabel: t('reset'),
        onConfirm: reset,
      });
    }
  };

  const canUndo = count > 0 || (activeFlow !== null && activeFlow.step > 1);

  return (
    <ThemedView style={styles.container}>
      {themePack ? <ThemePattern pack={themePack} /> : null}
      <SafeAreaView style={styles.safeArea}>
        {activeFlow ? (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={[styles.centered, { color: theme.onAccent }]}>
              {t('flowStep', { title: flowName, step: activeFlow.step, steps: activeFlow.steps })}
            </ThemedText>
          </View>
        ) : null}

        {/* Scrolls when a long dua does not fit, so the ring always stays on screen. Keyed so each
            dhikr starts at the top. */}
        <ScrollArea key={selected.id} style={styles.header} contentContainerStyle={styles.headerContent}>
          {showArabic ? (
            <ThemedText style={arabicStyle}>{selected.arabic}</ThemedText>
          ) : null}
          {showText ? (
            <ThemedText
              type={long ? 'smallBold' : 'subtitle'}
              style={long ? styles.centered : styles.title}>
              {text}
            </ThemedText>
          ) : null}
          {showTranslation ? (
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
        </ScrollArea>

        <Pressable
          onPress={handleTap}
          accessibilityRole="button"
          accessibilityLabel={t('countLabel', { title })}
          accessibilityValue={{ text: endless ? String(shown) : `${shown} / ${target}` }}
          style={styles.ringPress}>
          {/* A soft light behind the ring when a round is complete. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                width: ringSize + Spacing.five,
                height: ringSize + Spacing.five,
                borderRadius: (ringSize + Spacing.five) / 2,
                backgroundColor: theme.accent,
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.32] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.06] }) }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: press }] }}>
          <ProgressRing size={ringSize} progress={endless ? 0 : shown / target}>
            <ThemedText
              style={[styles.count, shown > 99999 ? styles.countSmall : shown > 9999 && styles.countMedium]}>
              {shown}
            </ThemedText>
            {endless ? null : (
              <ThemedText themeColor="textSecondary">{t('ofTarget', { n: target })}</ThemedText>
            )}
          </ProgressRing>
          </Animated.View>
        </Pressable>

        <View style={styles.status}>
          {endless ? null : (
            <ThemedText themeColor="textSecondary" style={styles.centered}>
              {activeFlow
                ? activeFlow.done
                  ? t('flowDone', { title: flowName })
                  : upNext
                    ? t('flowUpNext', { title: dhikrTitle(upNext.dhikr), n: upNext.target })
                    : t('flowLast')
                : t('rounds', { n: rounds })}
            </ThemedText>
          )}

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
              {todayTotal >= goal ? (
                // Finished today's wird: offer the card to share, without interrupting the counting.
                <Pressable onPress={() => setSharing(true)} accessibilityRole="button" hitSlop={Spacing.two}>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {t('shareFinished')}
                  </ThemedText>
                </Pressable>
              ) : null}
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
          {activeFlow ? (
            <ActionButton label={t('exit')} onPress={exitFlow} />
          ) : (
            // Dhikr counted on a tasbih or by heart. A flow moves step by step, so not there.
            <ActionButton label={`+ ${t('add')}`} onPress={() => setAddVisible(true)} />
          )}
        </View>
      </SafeAreaView>

      <AddCountDialog
        visible={addVisible}
        title={title}
        onAdd={({ amount, day }) => {
          addCount(amount, { day });
          if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
        }}
        onClose={() => setAddVisible(false)}
      />
      <ShareDialog
        visible={sharing}
        count={todayTotal}
        streak={currentStreak(history, frozenDays)}
        goalReached={goal !== null && todayTotal >= goal}
        onClose={() => setSharing(false)}
      />
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
    fontFamily: AppFonts.arabic,
    fontSize: 40,
    lineHeight: 64,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arabicLong: {
    fontFamily: AppFonts.arabic,
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arabicVeryLong: {
    fontFamily: AppFonts.arabic,
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
    fontFamily: AppFonts.bold,
    fontVariant: ['tabular-nums'],
  },
  // Long counts on the free counter still have to fit inside the ring.
  countMedium: {
    fontSize: 56,
    lineHeight: 64,
  },
  countSmall: {
    fontSize: 44,
    lineHeight: 52,
  },
  ringPress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
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
