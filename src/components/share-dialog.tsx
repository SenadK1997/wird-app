import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, Spacing } from '@/constants/theme';
import { SUGGESTED_DHIKR } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { shareProgress } from '@/utils/share-progress';

/** The Arabic on the card comes from the app's own, verified Alhamdulillah, never retyped. */
const ALHAMDULILLAH = SUGGESTED_DHIKR.find((d) => d.id === 'alhamdulillah')?.arabic;

type ShareDialogProps = {
  visible: boolean;
  count: number;
  streak: number;
  /** Today's goal is reached: the card says so and gives thanks. */
  goalReached?: boolean;
  onClose: () => void;
};

/** Shows the card that gets shared, so the user sees it before sending it anywhere. */
export function ShareDialog({ visible, count, streak, goalReached, onClose }: ShareDialogProps) {
  const theme = useTheme();
  const { t, formatNumber, locale } = useI18n();
  const card = useRef<View>(null);
  const [status, setStatus] = useState<string | null>(null);

  const close = () => {
    setStatus(null);
    onClose();
  };

  const handleShare = async () => {
    try {
      const result = await shareProgress(card, t('shareText', { count, streak }));
      if (result === 'copied') setStatus(t('copied'));
      else close();
    } catch {
      // Includes the user backing out of the share sheet on some platforms.
      setStatus(t('shareFailed'));
    }
  };

  const date = new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const onCard = { color: theme.onAccent };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('close')}>
        {/* Swallows presses so tapping the dialog itself does not dismiss it. */}
        <Pressable onPress={() => {}}>
          <ThemedView style={styles.dialog}>
            {goalReached ? (
              <ThemedText type="smallBold" style={styles.heading}>
                {t('goalReachedTitle')}
              </ThemedText>
            ) : null}

            {/* collapsable={false} keeps this a real native view so it can be captured as an image. */}
            <View
              ref={card}
              collapsable={false}
              style={[styles.card, { backgroundColor: theme.accent }]}>
              <View style={styles.cardTop}>
                <ThemedText type="smallBold" style={onCard}>
                  Wird
                </ThemedText>
                <ThemedText type="small" style={onCard}>
                  {date}
                </ThemedText>
              </View>
              {goalReached && ALHAMDULILLAH ? (
                <ThemedText style={[styles.arabic, onCard]}>{ALHAMDULILLAH}</ThemedText>
              ) : null}
              <ThemedText style={[styles.count, onCard]}>{formatNumber(count)}</ThemedText>
              <ThemedText style={onCard}>{t('dhikrToday')}</ThemedText>
              {goalReached ? (
                <ThemedText type="smallBold" style={onCard}>
                  ✓ {t('dailyGoalReached')}
                </ThemedText>
              ) : null}
              <View style={[styles.divider, { backgroundColor: theme.onAccent }]} />
              <ThemedText type="small" style={onCard}>
                {t('dayStreak')}: {formatNumber(streak)}
              </ThemedText>
            </View>

            {status ? <ThemedText themeColor="textSecondary">{status}</ThemedText> : null}

            <View style={styles.buttons}>
              <Button label={t('close')} onPress={close} style={styles.button} />
              <Button
                label={t('shareAction')}
                onPress={handleShare}
                variant="primary"
                style={styles.button}
              />
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    minWidth: 280,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  card: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  cardTop: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  arabic: {
    fontFamily: AppFonts.arabic,
    fontSize: 30,
    lineHeight: 52,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  count: {
    fontSize: 64,
    lineHeight: 72,
    fontFamily: AppFonts.bold,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    opacity: 0.4,
    marginVertical: Spacing.two,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
  },
});
