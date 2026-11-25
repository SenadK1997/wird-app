import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { useConfirm } from '@/components/confirm-dialog';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, Spacing } from '@/constants/theme';
import type { Dhikr } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import type { History, PersonalGoal } from '@/store/dhikr-store';
import { dayKey, formatDay } from '@/utils/date';

const PRESETS = [1000, 10000, 100000];
export const MAX_PERSONAL_GOAL = 10_000_000;

/** Dhikr counted toward a goal: its dhikr (or all) from its start day on, hand-added counts too. */
export function goalProgress(goal: PersonalGoal, history: History) {
  let done = 0;
  for (const [day, totals] of Object.entries(history)) {
    if (day < goal.start) continue;
    if (goal.dhikrId === null) for (const n of Object.values(totals)) done += n;
    else done += totals[goal.dhikrId] ?? 0;
  }
  return done;
}

type Props = {
  goals: PersonalGoal[];
  history: History;
  /** Dhikr to build a goal on, most likely first. */
  choices: Dhikr[];
  titleOf: (dhikrId: string) => string;
  onSave: (input: Omit<PersonalGoal, 'id'>) => void;
  onRemove: (id: string) => void;
};

/** Long-term goals such as 100,000 salawat, with their progress. */
export function PersonalGoals({ goals, history, choices, titleOf, onSave, onRemove }: Props) {
  const theme = useTheme();
  const confirm = useConfirm();
  const { t, locale, formatNumber } = useI18n();
  const [creating, setCreating] = useState(false);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {goals.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('goalsEmpty')}
        </ThemedText>
      ) : null}
      {goals.map((goal) => {
        const done = goalProgress(goal, history);
        const complete = done >= goal.target;
        const name = goal.dhikrId === null ? t('allDhikr') : titleOf(goal.dhikrId);
        return (
          <View key={goal.id} style={styles.goal}>
            <View style={styles.row}>
              <ThemedText type="smallBold" style={styles.flex} numberOfLines={2}>
                {name}
              </ThemedText>
              <ThemedText type="smallBold" style={complete ? { color: theme.accent } : undefined}>
                {complete ? `✓ ${t('goalComplete')}` : `${Math.floor((done / goal.target) * 100)}%`}
              </ThemedText>
            </View>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(100, (done / goal.target) * 100)}%`, backgroundColor: theme.accent },
                ]}
              />
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                {t('goalLine', { count: Math.min(done, goal.target), target: goal.target })} ·{' '}
                {t('since', { date: formatDay(goal.start, locale) })}
              </ThemedText>
              <Pressable
                onPress={() =>
                  confirm({
                    title: t('removeGoalTitle'),
                    message: t('removeGoalMessage', { title: name, target: formatNumber(goal.target) }),
                    actionLabel: t('remove'),
                    onConfirm: () => onRemove(goal.id),
                  })
                }
                accessibilityRole="button"
                hitSlop={Spacing.two}>
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  {t('remove')}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Button label={`+ ${t('newGoal')}`} onPress={() => setCreating(true)} />
      <GoalDialog
        visible={creating}
        choices={choices}
        onSave={onSave}
        onClose={() => setCreating(false)}
      />
    </ThemedView>
  );
}

type GoalDialogProps = {
  visible: boolean;
  choices: Dhikr[];
  onSave: (input: Omit<PersonalGoal, 'id'>) => void;
  onClose: () => void;
};

/** Picks a dhikr (or all) and a target. A goal counts from today on. */
function GoalDialog({ visible, choices, onSave, onClose }: GoalDialogProps) {
  const theme = useTheme();
  const { t, formatNumber, dhikrTitle } = useI18n();
  // `null` is "all dhikr"; undefined is nothing picked yet.
  const [dhikrId, setDhikrId] = useState<string | null | undefined>(undefined);
  const [text, setText] = useState('');
  const [error, setError] = useState<'dhikr' | 'target' | null>(null);

  const target = Number(text);
  const valid = /^\d+$/.test(text) && target >= 1 && target <= MAX_PERSONAL_GOAL;

  const close = () => {
    setDhikrId(undefined);
    setText('');
    setError(null);
    onClose();
  };

  const save = () => {
    if (dhikrId === undefined) return setError('dhikr');
    if (!valid) return setError('target');
    onSave({ dhikrId, target, start: dayKey() });
    close();
  };

  const option = (id: string | null, label: string) => (
    <Pressable
      key={id ?? 'all'}
      onPress={() => {
        setDhikrId(id);
        setError(null);
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: dhikrId === id }}
      style={[
        styles.option,
        { borderColor: dhikrId === id ? theme.accent : theme.border },
        dhikrId === id && { backgroundColor: theme.backgroundSelected },
      ]}>
      <ThemedText type="small" numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('cancel')}>
        <Pressable onPress={() => {}}>
          <ThemedView style={styles.dialog}>
            <ThemedText type="smallBold" style={styles.title}>
              {t('newGoal')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('newGoalHint')}
            </ThemedText>

            <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
              {option(null, t('allDhikr'))}
              {choices.map((d) => option(d.id, dhikrTitle(d)))}
            </ScrollView>

            <TextInput
              value={text}
              onChangeText={(value) => {
                setText(value.replace(/\D/g, ''));
                setError(null);
              }}
              keyboardType="number-pad"
              placeholder={t('goalTarget')}
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel={t('goalTarget')}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <View style={styles.chips}>
              {PRESETS.map((n) => (
                <Chip key={n} label={formatNumber(n)} selected={text === String(n)} onPress={() => setText(String(n))} />
              ))}
            </View>
            {error ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {error === 'dhikr' ? t('pickDhikr') : t('errorGoal', { max: MAX_PERSONAL_GOAL })}
              </ThemedText>
            ) : null}

            <View style={styles.buttons}>
              <Button label={t('cancel')} onPress={close} style={styles.flex} />
              <Button label={t('save')} onPress={save} variant="primary" style={styles.flex} />
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  goal: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    minWidth: 280,
    maxHeight: '90%',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  options: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 220,
  },
  optionsContent: {
    gap: Spacing.one,
  },
  option: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
    fontFamily: AppFonts.bold,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
