import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

type FormHeaderProps = {
  onCancel: () => void;
  onSave: () => void;
  /** Shown under the buttons, where the keyboard cannot cover it. */
  error: string | null;
};

/**
 * Cancel and Save pinned to the top of a form sheet, so they stay in reach while the keyboard
 * covers the bottom of the screen.
 */
export function FormHeader({ onCancel, onSave, error }: FormHeaderProps) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button label={t('cancel')} onPress={onCancel} style={styles.button} />
        <Button label={t('save')} onPress={onSave} variant="primary" style={styles.button} />
      </View>
      {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    minWidth: 104,
  },
});
