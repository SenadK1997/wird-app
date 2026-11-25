import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { storeLink, VERSION_URL } from '@/constants/app-info';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';
import { dayKey, dayKeyDaysAgo } from '@/utils/date';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
/** After "Later", ask again only after this many days. */
const REMIND_EVERY_DAYS = 3;
const TIMEOUT_MS = 8000;

/** True when `latest` is a higher version than `current` ("1.0.10" is higher than "1.0.9"). */
export function isNewer(latest: string, current: string) {
  const a = latest.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const b = current.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/**
 * Tells people on an older version that an update is in the store. The newest version per
 * platform is a small file on the support site (docs/version.json), edited after each release
 * goes live. No internet, or the file missing, simply means no prompt.
 */
export function UpdatePrompt({ active }: { active: boolean }) {
  const { t } = useI18n();
  const { onboarded, updateRemindedOn, set } = useDhikrStore();
  const [latest, setLatest] = useState<string | null>(null);

  const recentlyAsked = updateRemindedOn !== null && updateRemindedOn > dayKeyDaysAgo(REMIND_EVERY_DAYS);
  const ready = active && onboarded && Platform.OS !== 'web' && !recentlyAsked;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    fetch(VERSION_URL, { signal: controller.signal, cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        const version =
          typeof data === 'object' && data !== null
            ? (data as Record<string, unknown>)[Platform.OS === 'android' ? 'android' : 'ios']
            : null;
        if (typeof version === 'string' && isNewer(version, APP_VERSION)) setLatest(version);
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready]);

  const later = () => {
    set({ updateRemindedOn: dayKey() });
    setLatest(null);
  };

  const update = () => {
    set({ updateRemindedOn: dayKey() });
    setLatest(null);
    Linking.openURL(storeLink).catch(() => {});
  };

  return (
    <Modal visible={latest !== null} transparent animationType="fade" onRequestClose={later}>
      <Pressable style={styles.backdrop} onPress={later} accessibilityLabel={t('later')}>
        <Pressable onPress={() => {}}>
          <ThemedView style={styles.dialog}>
            <ThemedText type="smallBold" style={styles.title}>
              {t('updateTitle')}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {t('updateMessage', { version: latest ?? '' })}
            </ThemedText>
            <View style={styles.buttons}>
              <Button label={t('later')} onPress={later} style={styles.button} />
              <Button label={t('updateAction')} onPress={update} variant="primary" style={styles.button} />
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
