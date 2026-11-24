import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MAX_TARGET } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

const PRESETS = [33, 100, 1000];

type AddCountDialogProps = {
  visible: boolean;
  /** Name of the dhikr the count is added to. */
  title: string;
  onAdd: (amount: number, daysAgo: number) => void;
  onClose: () => void;
};

/**
 * Adds dhikr counted somewhere else — on a tasbih, on fingers, by heart — so it still counts
 * toward the daily goal, the streak and the history.
 */
export function AddCountDialog({ visible, title, onAdd, onClose }: AddCountDialogProps) {
  const theme = useTheme();
  const { t, formatNumber } = useI18n();
  const [text, setText] = useState('');
  const [daysAgo, setDaysAgo] = useState(0);
  const [showError, setShowError] = useState(false);

  const amount = Number(text);
  const valid = /^\d+$/.test(text) && amount >= 1 && amount <= MAX_TARGET;

  const close = () => {
    setText('');
    setDaysAgo(0);
    setShowError(false);
    onClose();
  };

  const handleAdd = () => {
    if (!valid) {
      setShowError(true);
      return;
    }
    onAdd(amount, daysAgo);
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('cancel')}>
        {/* Swallows presses so tapping the dialog itself does not dismiss it. */}
        <Pressable onPress={() => {}}>
          <ThemedView style={styles.dialog}>
            <ThemedText type="smallBold" style={styles.heading}>
              {t('addCountTitle')}
            </ThemedText>
            <ThemedText themeColor="textSecondary">{t('addCountHint', { title })}</ThemedText>

            <TextInput
              accessibilityLabel={t('count')}
              value={text}
              onChangeText={(value) => {
                setText(value.replace(/\D/g, ''));
                setShowError(false);
              }}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              onSubmitEditing={handleAdd}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            />
            {showError ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {t('errorGoal', { max: MAX_TARGET })}
              </ThemedText>
            ) : null}
            <View style={styles.chips}>
              {PRESETS.map((value) => (
                <Chip
                  key={value}
                  label={formatNumber(value)}
                  selected={text === String(value)}
                  onPress={() => {
                    setText(String(value));
                    setShowError(false);
                  }}
                />
              ))}
            </View>

            <View style={styles.chips}>
              <Chip label={t('today')} selected={daysAgo === 0} onPress={() => setDaysAgo(0)} />
              <Chip label={t('yesterday')} selected={daysAgo === 1} onPress={() => setDaysAgo(1)} />
            </View>

            <View style={styles.buttons}>
              <Button label={t('cancel')} onPress={close} style={styles.button} />
              <Button label={t('add')} onPress={handleAdd} variant="primary" style={styles.button} />
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 18,
    lineHeight: 26,
  },
  input: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    fontVariant: ['tabular-nums'],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
  },
});
