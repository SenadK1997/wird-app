import Constants from 'expo-constants';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BUILDERS, COMPANY, CONTACT_EMAIL, PRIVACY_UPDATED } from '@/constants/app-info';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { PRIVACY_SECTIONS } from '@/data/privacy';
import { useI18n } from '@/i18n';
import { layoutDirection } from '@/utils/direction';

type SheetProps = { visible: boolean; onClose: () => void };

export function AboutSheet({ visible, onClose }: SheetProps) {
  const { t } = useI18n();

  return (
    <Sheet visible={visible} onClose={onClose} title={t('aboutWird')}>
      <View style={styles.identity}>
        <Image source={require('@/assets/images/app-icon.png')} style={styles.icon} />
        <ThemedText type="subtitle">Wird</ThemedText>
        <ThemedText themeColor="textSecondary">
          {t('version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
        </ThemedText>
      </View>

      <ThemedText>{t('aboutText')}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('sourcesNote')}</ThemedText>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{t('madeBy', { company: COMPANY })}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('builtBy', { names: BUILDERS })}</ThemedText>
        {CONTACT_EMAIL ? (
          <ThemedText themeColor="textSecondary">
            {t('contact')}: {CONTACT_EMAIL}
          </ThemedText>
        ) : null}
      </ThemedView>
    </Sheet>
  );
}

export function PrivacySheet({ visible, onClose }: SheetProps) {
  const { t } = useI18n();

  return (
    <Sheet visible={visible} onClose={onClose} title={t('privacyPolicy')}>
      {/* The policy itself is in English only, so it is laid out left to right. */}
      <View style={[styles.policy, layoutDirection(false)]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.ltr}>
          Last updated: {PRIVACY_UPDATED}
        </ThemedText>
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText type="smallBold" style={styles.ltr}>
              {section.title}
            </ThemedText>
            <ThemedText style={styles.ltr}>{section.body}</ThemedText>
          </View>
        ))}
        {CONTACT_EMAIL ? (
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.ltr}>
              Contact
            </ThemedText>
            <ThemedText style={styles.ltr}>
              Questions about this policy: {CONTACT_EMAIL}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

type FrameProps = SheetProps & { title: string; children: ReactNode };

function Sheet({ visible, onClose, title, children }: FrameProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText type="subtitle">{title}</ThemedText>
            {children}
            <Button label={t('close')} onPress={onClose} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
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
  identity: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  policy: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.one,
  },
  ltr: {
    writingDirection: 'ltr',
    textAlign: 'left',
  },
});
