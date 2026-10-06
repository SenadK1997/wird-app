import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Shares a picture of the given card. Returns what happened so the caller can tell the user. */
export async function shareProgress(card: RefObject<View | null>, _text: string): Promise<'shared' | 'copied'> {
  const uri = await captureRef(card, { format: 'png', quality: 1 });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
  return 'shared';
}
