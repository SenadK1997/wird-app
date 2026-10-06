import { createContext, use, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';

type ConfirmRequest = {
  title: string;
  message: string;
  actionLabel: string;
  onConfirm: () => void;
};

const ConfirmContext = createContext<((request: ConfirmRequest) => void) | null>(null);

/**
 * Asks before a destructive action with an in-app dialog, so it looks and behaves the same on
 * every platform (browser dialogs can be blocked, and `Alert` has no web implementation).
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const close = () => setRequest(null);
  const handleConfirm = () => {
    request?.onConfirm();
    close();
  };

  return (
    <ConfirmContext value={setRequest}>
      {children}
      <Modal visible={request !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('cancel')}>
          {/* Swallows presses so tapping the dialog itself does not dismiss it. */}
          <Pressable accessibilityRole="alert" onPress={() => {}}>
            <ThemedView style={styles.dialog}>
              <ThemedText type="smallBold" style={styles.title}>
                {request?.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{request?.message}</ThemedText>
              <View style={styles.buttons}>
                <Button label={t('cancel')} onPress={close} style={styles.button} />
                <Button
                  label={request?.actionLabel ?? ''}
                  onPress={handleConfirm}
                  variant="danger"
                  style={styles.button}
                />
              </View>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext>
  );
}

export function useConfirm() {
  const confirm = use(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
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
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    flex: 1,
  },
});
