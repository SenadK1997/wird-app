import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { shareProgress } from '@/utils/share-progress';

type ShareDialogProps = {
  visible: boolean;
  count: number;
  streak: number;
  onClose: () => void;
};

/** Shows the card that gets shared, so the user sees it before sending it anywhere. */
export function ShareDialog({ visible, count, streak, onClose }: ShareDialogProps) {
  const theme = useTheme();
  const { t, formatNumber } = useI18n();
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('close')}>
        {/* Swallows presses so tapping the dialog itself does not dismiss it. */}
        <Pressable onPress={() => {}}>
          <ThemedView style={styles.dialog}>
            {/* collapsable={false} keeps this a real native view so it can be captured as an image. */}
            <View
              ref={card}
              collapsable={false}
              style={[styles.card, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Wird · {t('shareTitle')}
              </ThemedText>
              <ThemedText style={[styles.count, { color: theme.onAccent }]}>
                {formatNumber(count)}
              </ThemedText>
              <ThemedText style={{ color: theme.onAccent }}>{t('dhikrToday')}</ThemedText>
              <ThemedText type="small" style={{ color: theme.onAccent }}>
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
  card: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  count: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
  },
});
