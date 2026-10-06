import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { MAX_FLOW_STEPS, MAX_TARGET, type Flow, type FlowStep } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';

export type FlowFormValues = { title: string; steps: FlowStep[] };

type FlowFormProps = {
  visible: boolean;
  /** The custom flow being edited, or `undefined` when creating one. */
  editing?: Flow;
  onSubmit: (values: FlowFormValues) => void;
  onClose: () => void;
};

export function FlowForm({ visible, editing, onSubmit, onClose }: FlowFormProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Keyed so the fields start fresh each time the form opens. */}
      {visible ? (
        <FormBody key={editing?.id ?? 'new'} editing={editing} onSubmit={onSubmit} onClose={onClose} />
      ) : null}
    </Modal>
  );
}

// The count is kept as typed text so a half-edited number does not jump around.
type DraftStep = { key: number; dhikrId: string; target: string };

function FormBody({ editing, onSubmit, onClose }: Omit<FlowFormProps, 'visible'>) {
  const theme = useTheme();
  const { t } = useI18n();
  const { suggested, custom, findDhikr } = useDhikrStore();
  const [title, setTitle] = useState(editing?.title ?? '');
  const [steps, setSteps] = useState<DraftStep[]>(
    () => editing?.steps.map((s, i) => ({ key: i, dhikrId: s.dhikrId, target: String(s.target) })) ?? []
  );
  const [nextKey, setNextKey] = useState(steps.length);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  const addStep = (dhikrId: string) => {
    const dhikr = findDhikr(dhikrId);
    setSteps([...steps, { key: nextKey, dhikrId, target: String(dhikr?.target ?? 33) }]);
    setNextKey(nextKey + 1);
    setPicking(false);
  };

  const move = (index: number, by: number) => {
    const next = [...steps];
    const [step] = next.splice(index, 1);
    next.splice(index + by, 0, step);
    setSteps(next);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('errorFlowName'));
      return;
    }
    if (steps.length === 0) {
      setError(t('errorFlowSteps'));
      return;
    }
    const valid = steps.every(
      (s) => /^\d+$/.test(s.target.trim()) && Number(s.target) >= 1 && Number(s.target) <= MAX_TARGET
    );
    if (!valid) {
      setError(t('errorStepTarget', { max: MAX_TARGET }));
      return;
    }
    onSubmit({
      title: trimmedTitle,
      steps: steps.map((s) => ({ dhikrId: s.dhikrId, target: Number(s.target) })),
    });
  };

  if (picking) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText type="subtitle">{t('chooseDhikr')}</ThemedText>
            {[...custom, ...suggested].map((dhikr) => (
              <Pressable
                key={dhikr.id}
                onPress={() => addStep(dhikr.id)}
                accessibilityRole="button"
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.option}>
                  <ThemedText type="smallBold">{dhikr.title}</ThemedText>
                </ThemedView>
              </Pressable>
            ))}
            <Button label={t('back')} onPress={() => setPicking(false)} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">{t(editing ? 'editFlow' : 'newFlow')}</ThemedText>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('flowName')}</ThemedText>
            <TextInput
              accessibilityLabel={t('flowName')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('flowNamePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              maxLength={60}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('steps')}</ThemedText>
            {steps.map((step, index) => (
              <ThemedView key={step.key} type="backgroundElement" style={styles.step}>
                <ThemedText type="smallBold" style={styles.stepTitle} numberOfLines={2}>
                  {index + 1}. {findDhikr(step.dhikrId)?.title ?? t('deletedDhikr')}
                </ThemedText>
                <View style={styles.stepControls}>
                  <TextInput
                    accessibilityLabel={`${t('count')} ${index + 1}`}
                    value={step.target}
                    onChangeText={(target) =>
                      setSteps(steps.map((s) => (s.key === step.key ? { ...s, target } : s)))
                    }
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.stepInput, { color: theme.text, backgroundColor: theme.background }]}
                  />
                  <IconButton
                    symbol="↑"
                    label={t('moveUp')}
                    disabled={index === 0}
                    onPress={() => move(index, -1)}
                  />
                  <IconButton
                    symbol="↓"
                    label={t('moveDown')}
                    disabled={index === steps.length - 1}
                    onPress={() => move(index, 1)}
                  />
                  <IconButton
                    symbol="✕"
                    label={t('remove')}
                    onPress={() => setSteps(steps.filter((s) => s.key !== step.key))}
                  />
                </View>
              </ThemedView>
            ))}
            <Button
              label={t('addStep')}
              onPress={() => setPicking(true)}
              disabled={steps.length >= MAX_FLOW_STEPS}
            />
          </View>

          {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

          <View style={styles.buttons}>
            <Button label={t('cancel')} onPress={onClose} style={styles.button} />
            <Button label={t('save')} onPress={handleSave} variant="primary" style={styles.button} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

type IconButtonProps = { symbol: string; label: string; disabled?: boolean; onPress: () => void };

function IconButton({ symbol, label, disabled, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.one}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
      <ThemedView type="backgroundSelected" style={styles.iconButton}>
        <ThemedText type="smallBold">{symbol}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  option: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  step: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  stepTitle: {
    flexShrink: 1,
  },
  stepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 700,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  button: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
