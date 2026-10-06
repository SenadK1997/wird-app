import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Browsers cannot share a picture of a view, so the web shares or copies the text instead. */
export async function shareProgress(_card: RefObject<View | null>, text: string): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share({ text });
    return 'shared';
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
