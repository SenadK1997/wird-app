import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MAX_TARGET, type Dhikr } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { dayKeyDaysAgo } from '@/utils/date';

const PRESETS = [33, 100, 1000];

export type AddCountResult = { amount: number; day: string; dhikrId?: string };

type AddCountDialogProps = {
  visible: boolean;
  /** Name of the dhikr the count is added to. Leave out to let the user pick from `choices`. */
  title?: string;
  /** Dhikr to choose from, most likely first. Used when `title` is not given. */
  choices?: Dhikr[];
  /** A fixed day (`YYYY-MM-DD`) and how to show it. Without it, the user picks today or yesterday. */
  day?: { key: string; label: string };
  onAdd: (result: AddCountResult) => void;
  onClose: () => void;
};

/**
 * Adds dhikr counted somewhere else — on a tasbih, on fingers, by heart — so it still counts
 * toward the daily goal, the streak and the history.
 */
export function AddCountDialog({ visible, title, choices, day, onAdd, onClose }: AddCountDialogProps) {
  const theme = useTheme();
  const { t, formatNumber, dhikrTitle } = useI18n();
  const [text, setText] = useState('');
  const [daysAgo, setDaysAgo] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<'amount' | 'dhikr' | null>(null);

  const amount = Number(text);
  const validAmount = /^\d+$/.test(text) && amount >= 1 && amount <= MAX_TARGET;
  const picking = title === undefined;
  const pickedDhikr = picking ? choices?.find((d) => d.id === picked) : undefined;

  const close = () => {
    setText('');
    setDaysAgo(0);
    setPicked(null);
    setError(null);
    onClose();
  };

  const handleAdd = () => {
    if (picking && !pickedDhikr) return setError('dhikr');
    if (!validAmount) return setError('amount');
    onAdd({ amount, day: day?.key ?? dayKeyDaysAgo(daysAgo), dhikrId: pickedDhikr?.id });
    close();
  };

  const name = picking ? (pickedDhikr ? dhikrTitle(pickedDhikr) : '…') : title;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('cancel')}>
        {/* Swallows presses so tapping the dialog itself does not dismiss it. */}
        <Pressable onPress={() => {}} style={styles.dialogPress}>
          <ThemedView style={styles.dialog}>
            <ThemedText type="smallBold" style={styles.heading}>
              {t('addCountTitle')}
              {day ? ` · ${day.label}` : ''}
            </ThemedText>

            {picking ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('pickDhikr')}
                </ThemedText>
                <ScrollView style={[styles.pickList, { borderColor: theme.border }]} nestedScrollEnabled>
                  {(choices ?? []).map((d) => {
                    const on = d.id === picked;
                    return (
                      <Pressable
                        key={d.id}
                        onPress={() => {
                          setPicked(d.id);
                          setError(null);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        style={[styles.pickRow, on && { backgroundColor: theme.accent }]}>
                        <ThemedText type="small" style={on && { color: theme.onAccent }} numberOfLines={1}>
                          {dhikrTitle(d)}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {error === 'dhikr' ? (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {t('pickDhikr')}
                  </ThemedText>
                ) : null}
              </>
            ) : (
              <ThemedText themeColor="textSecondary">{t('addCountHint', { title: name ?? '' })}</ThemedText>
            )}

            <TextInput
              accessibilityLabel={t('count')}
              value={text}
              onChangeText={(value) => {
                setText(value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={!picking}
              onSubmitEditing={handleAdd}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            />
            {error === 'amount' ? (
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
                    setError(null);
                  }}
                />
              ))}
            </View>

            {day ? null : (
              <View style={styles.chips}>
                <Chip label={t('today')} selected={daysAgo === 0} onPress={() => setDaysAgo(0)} />
                <Chip label={t('yesterday')} selected={daysAgo === 1} onPress={() => setDaysAgo(1)} />
              </View>
            )}

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
  dialogPress: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  dialog: {
    width: '100%',
    minWidth: 280,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 18,
    lineHeight: 26,
  },
  pickList: {
    maxHeight: 190,
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
  pickRow: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
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
