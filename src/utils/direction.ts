import { Platform, type ViewStyle } from 'react-native';

/** Style that lays a view's children out right-to-left or left-to-right. */
export function layoutDirection(rtl: boolean): ViewStyle {
  const value = rtl ? 'rtl' : 'ltr';
  // The same setting has two names: `direction` on phones, `writingDirection` in the web build,
  // which reports `direction` as an invalid style.
  return Platform.OS === 'web' ? ({ writingDirection: value } as ViewStyle) : { direction: value };
}
