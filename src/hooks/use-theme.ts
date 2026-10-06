/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Accents, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDhikrStore } from '@/store/dhikr-store';

/** Light or dark, from the theme chosen in Settings or the phone's own setting. */
export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { themeMode } = useDhikrStore();
  if (themeMode !== 'system') return themeMode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useScheme();
  const { accent } = useDhikrStore();

  return { ...Colors[scheme], ...Accents[accent][scheme] };
}
