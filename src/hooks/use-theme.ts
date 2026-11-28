/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Accents, Colors, THEME_PACKS } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDhikrStore } from '@/store/dhikr-store';

/** Light or dark, from the theme chosen in Settings or the phone's own setting. */
export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { themeMode, themePack } = useDhikrStore();
  // An unlocked theme is light or dark by design.
  if (themePack) return THEME_PACKS[themePack].scheme;
  if (themeMode !== 'system') return themeMode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useScheme();
  const { accent, themePack } = useDhikrStore();

  if (themePack) return THEME_PACKS[themePack].colors;
  return { ...Colors[scheme], ...Accents[accent][scheme] };
}
