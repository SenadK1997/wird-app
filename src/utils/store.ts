import * as StoreReview from 'expo-store-review';
import { Linking, Platform, Share } from 'react-native';

import { APP_STORE_ID, appStoreLink } from '@/constants/app-info';

/** Shows the system's "rate this app" prompt, where the platform has one. */
export async function requestRating() {
  try {
    if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
  } catch {
    // The system decides whether to show the prompt; failing to is never worth an error.
  }
}

/** Opens the store's review page once the app has a store id, and the system prompt until then. */
export async function openRating() {
  if (APP_STORE_ID && Platform.OS === 'ios') {
    await Linking.openURL(`${appStoreLink}?action=write-review`);
    return;
  }
  await requestRating();
}

/**
 * Opens the share sheet with a line about the app. Returns `copied` when sharing is not
 * available and the text went to the clipboard instead (some desktop browsers).
 */
export async function shareApp(message: string): Promise<'shared' | 'copied' | 'unavailable'> {
  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    if (Platform.OS === 'web' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      return 'copied';
    }
    return 'unavailable';
  }
}
