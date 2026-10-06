import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Reserves the space where a banner ad will go once AdMob is wired in.
 * Only visible in development; renders nothing in release builds.
 */
export function AdSlot() {
  if (!__DEV__) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.slot}>
      <ThemedText type="small" themeColor="textSecondary">
        Banner ad placeholder
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: 50,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
