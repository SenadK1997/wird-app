import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAdsReady } from '@/ads/ads-provider';
import { BannerView } from '@/ads/sdk';
import { BottomTabInset } from '@/constants/theme';

/**
 * A banner ad pinned to the bottom of a screen, just above the tab bar. Takes up no space until
 * an ad has actually loaded. Not used on the counter screen, where fast tapping would hit it.
 */
export function AdBanner() {
  const ready = useAdsReady();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<'loading' | 'shown' | 'failed'>('loading');

  if (!ready || state === 'failed') return null;

  return (
    <View
      style={[
        styles.container,
        // On iOS the screen runs on under the tab bar and the home indicator, so the banner needs
        // space under it to stay clear of them. On Android the screen already ends above the tab bar.
        state === 'shown' &&
          Platform.OS === 'ios' && { paddingBottom: BottomTabInset + insets.bottom },
      ]}>
      <BannerView onLoaded={() => setState('shown')} onFailed={() => setState('failed')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
