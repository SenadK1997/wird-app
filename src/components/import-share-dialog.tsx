import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, Spacing } from '@/constants/theme';
import type { Dhikr } from '@/data/dhikr';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';
import { onPendingShare, takePendingShare } from '@/utils/pending-share';
import { decodeShared, shareCodeFromUrl, type Shared, type SharedDhikr } from '@/utils/share-link';

/** The same dhikr is already saved: same name, Arabic and text. Targets may differ. */
const sameDhikr = (a: SharedDhikr, b: Dhikr) =>
  !b.builtIn &&
  a.title === b.title &&
  (a.arabic ?? '') === (b.arabic ?? '') &&
  (a.transliteration ?? '') === (b.transliteration ?? '');

/**
 * Asks whether to add a dhikr or flow someone shared as a link. Mounted once, after the launch
 * sequence; links that arrived before that (a cold start) are waiting in pending-share.
 */
export function ImportShareDialog({ active }: { active: boolean }) {
  const { t, formatNumber, dhikrTitle } = useI18n();
  const { custom, findDhikr, addCustom, saveFlow, select, onboarded } = useDhikrStore();
  // Someone new sees the welcome screen first; the link waits until it is done.
  const ready = active && onboarded;
  const [shared, setShared] = useState<Shared | 'invalid' | null>(null);

  useEffect(() => {
    if (!ready) return;
    const open = (code: string) => setShared(decodeShared(code) ?? 'invalid');
    const waiting = takePendingShare();
    if (waiting) open(waiting);
    // The web build has no app links, so a share opened in the browser arrives in the address.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const code = shareCodeFromUrl(window.location.href);
      if (code) {
        open(code);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    return onPendingShare(() => {
      const code = takePendingShare();
      if (code) open(code);
    });
  }, [ready]);

  const close = () => setShared(null);

  const handleAdd = () => {
    if (!shared || shared === 'invalid') return close();
    // Saved during this import, so a dhikr used twice in one flow is saved once.
    const added: { dhikr: SharedDhikr; id: string }[] = [];
    /** Saves a shared dhikr, or finds the one already saved. Returns its id. */
    const ensureDhikr = (dhikr: SharedDhikr) => {
      const known =
        custom.find((d) => sameDhikr(dhikr, d))?.id ??
        added.find((a) => JSON.stringify(a.dhikr) === JSON.stringify(dhikr))?.id;
      if (known) return known;
      const id = addCustom(dhikr);
      added.push({ dhikr, id });
      return id;
    };
    if (shared.kind === 'dhikr') {
      select(ensureDhikr(shared.dhikr));
      close();
      router.navigate('/');
      return;
    }
    const steps = shared.steps.flatMap((step) => {
      if ('dhikr' in step) return [{ dhikrId: ensureDhikr(step.dhikr), target: step.target }];
      // A built-in this version of the app does not have is left out.
      return findDhikr(step.builtInId) ? [{ dhikrId: step.builtInId, target: step.target }] : [];
    });
    if (steps.length > 0) saveFlow({ title: shared.title, steps });
    close();
    router.navigate('/dhikr');
  };

  const invalid = shared === 'invalid';
  const exists =
    shared && !invalid && shared.kind === 'dhikr' && custom.some((d) => sameDhikr(shared.dhikr, d));

  return (
    <Modal visible={shared !== null} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('cancel')}>
        <Pressable onPress={() => {}}>
          <ThemedView style={styles.dialog}>
            {invalid || !shared ? (
              <>
                <ThemedText type="smallBold" style={styles.title}>
                  {t('importInvalidTitle')}
                </ThemedText>
                <ThemedText themeColor="textSecondary">{t('importInvalid')}</ThemedText>
                <Button label={t('close')} onPress={close} />
              </>
            ) : (
              <>
                <ThemedText type="smallBold" style={styles.title}>
                  {t(shared.kind === 'dhikr' ? 'importDhikrTitle' : 'importFlowTitle')}
                </ThemedText>
                <ScrollView style={styles.preview} contentContainerStyle={styles.previewContent}>
                  {shared.kind === 'dhikr' ? (
                    <>
                      {shared.dhikr.arabic ? (
                        <ThemedText style={styles.arabic}>{shared.dhikr.arabic}</ThemedText>
                      ) : null}
                      <ThemedText type="smallBold" style={styles.centered}>
                        {shared.dhikr.title}
                      </ThemedText>
                      {shared.dhikr.transliteration ? (
                        <ThemedText themeColor="textSecondary" style={styles.centered}>
                          {shared.dhikr.transliteration}
                        </ThemedText>
                      ) : null}
                      <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                        {shared.dhikr.target === 0 ? '∞' : `${formatNumber(shared.dhikr.target)}×`}
                      </ThemedText>
                    </>
                  ) : (
                    <>
                      <ThemedText type="smallBold">{shared.title}</ThemedText>
                      {shared.steps.map((step, index) => {
                        const name =
                          'dhikr' in step
                            ? step.dhikr.title
                            : dhikrTitle(findDhikr(step.builtInId) ?? { id: step.builtInId, title: step.builtInId });
                        return (
                          <View key={index} style={styles.step}>
                            <ThemedText type="small" style={styles.stepName} numberOfLines={2}>
                              {index + 1}. {name}
                            </ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {formatNumber(step.target)}×
                            </ThemedText>
                          </View>
                        );
                      })}
                    </>
                  )}
                </ScrollView>
                {exists ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('importExists')}
                  </ThemedText>
                ) : null}
                <View style={styles.buttons}>
                  <Button label={t('cancel')} onPress={close} style={styles.button} />
                  <Button
                    label={exists ? t('start') : t('add')}
                    onPress={handleAdd}
                    variant="primary"
                    style={styles.button}
                  />
                </View>
              </>
            )}
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
    maxWidth: 380,
    minWidth: 280,
    maxHeight: '85%',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  // Long duas and flows scroll inside the dialog instead of squeezing it.
  preview: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 320,
  },
  previewContent: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  arabic: {
    fontFamily: AppFonts.arabic,
    fontSize: 26,
    lineHeight: 44,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  centered: {
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepName: {
    flex: 1,
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
