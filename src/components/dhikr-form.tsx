import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { MAX_TARGET, type Dhikr } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

export type DhikrFormValues = Pick<Dhikr, 'title' | 'arabic' | 'target'>;

type DhikrFormProps = {
  visible: boolean;
  /** The custom dhikr being edited, or `undefined` when adding a new one. */
  editing?: Dhikr;
  onSubmit: (values: DhikrFormValues) => void;
  onClose: () => void;
};

export function DhikrForm({ visible, editing, onSubmit, onClose }: DhikrFormProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Keyed so the fields start fresh each time the form opens. */}
      {visible ? (
        <FormBody key={editing?.id ?? 'new'} editing={editing} onSubmit={onSubmit} onClose={onClose} />
      ) : null}
    </Modal>
  );
}

function FormBody({ editing, onSubmit, onClose }: Omit<DhikrFormProps, 'visible'>) {
  const theme = useTheme();
  const { t } = useI18n();
  const [title, setTitle] = useState(editing?.title ?? '');
  const [arabic, setArabic] = useState(editing?.arabic ?? '');
  const [target, setTarget] = useState(String(editing?.target ?? 33));
  const [error, setError] = useState<string | null>(null);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('errorName'));
      return;
    }
    const parsedTarget = Number(target);
    if (!/^\d+$/.test(target.trim()) || parsedTarget < 1 || parsedTarget > MAX_TARGET) {
      setError(t('errorTarget', { max: MAX_TARGET }));
      return;
    }
    onSubmit({ title: trimmedTitle, arabic: arabic.trim() || undefined, target: parsedTarget });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">{t(editing ? 'editDhikr' : 'newDhikr')}</ThemedText>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('name')}</ThemedText>
            <TextInput
              accessibilityLabel={t('name')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('namePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              maxLength={80}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('arabicOptional')}</ThemedText>
            <TextInput
              accessibilityLabel={t('arabicOptional')}
              value={arabic}
              onChangeText={setArabic}
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.arabicInput]}
              maxLength={600}
              multiline
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('targetCount')}</ThemedText>
            <TextInput
              accessibilityLabel={t('targetCount')}
              value={target}
              onChangeText={setTarget}
              keyboardType="number-pad"
              style={inputStyle}
              maxLength={6}
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
    fontFamily: AppFonts.medium,
    fontSize: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  arabicInput: {
    fontFamily: AppFonts.arabic,
    fontSize: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    minHeight: 64,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  button: {
    flex: 1,
  },
});
