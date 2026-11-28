/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Dark is the app's main look: the deep teal and gold of the launch screens.
// Light is the same family turned over, ivory with teal text, for people who choose it.
export const Colors = {
  light: {
    text: '#0E2621',
    background: '#F6F1E6',
    backgroundElement: '#ECE4D3',
    backgroundSelected: '#DFD5BF',
    textSecondary: '#4E6259',
    border: '#D2C6AC',
    accent: '#6B5010',
    onAccent: '#ffffff',
    danger: '#A8321F',
  },
  dark: {
    text: '#F3EBDD',
    background: '#0E2621',
    backgroundElement: '#13302A',
    backgroundSelected: '#1E3E37',
    textSecondary: '#B8C4BC',
    border: '#24463E',
    accent: '#C9A45C',
    onAccent: '#0E2621',
    danger: '#F0907F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Accent colours the user can pick from; each replaces `accent` and `onAccent`. The dark
 * values are the three accents of the launch design; the light ones are darkened to stay
 * readable on ivory.
 */
export const Accents = {
  gold: {
    light: { accent: '#6B5010', onAccent: '#ffffff' },
    dark: { accent: '#C9A45C', onAccent: '#0E2621' },
  },
  green: {
    light: { accent: '#285E4D', onAccent: '#ffffff' },
    dark: { accent: '#7FB8A4', onAccent: '#0E2621' },
  },
  rose: {
    light: { accent: '#874632', onAccent: '#ffffff' },
    dark: { accent: '#E2B4A0', onAccent: '#0E2621' },
  },
} as const;

export type AccentId = keyof typeof Accents;
export type ThemeMode = 'system' | 'light' | 'dark';

export type Palette = { [K in keyof typeof Colors.dark]: string };

/** The background drawing a theme puts behind the counter (see components/theme-pattern). */
export type PatternId = 'diamonds' | 'stars' | 'dunes' | 'petals' | 'lattice' | 'marble' | 'zellige';

/**
 * Themes unlocked with one rewarded ad, each its own full look: colours, light or dark, and a
 * background pattern. Ids are saved on the phone, so never rename one.
 */
export const THEME_PACKS = {
  kiswa: {
    scheme: 'dark',
    pattern: 'diamonds',
    patternColor: '#C9A24A',
    colors: {
      text: '#EDE3C8',
      background: '#0B0B0C',
      backgroundElement: '#17150F',
      backgroundSelected: '#241F15',
      textSecondary: '#B9AE93',
      border: '#2E2819',
      accent: '#D4AF37',
      onAccent: '#0B0B0C',
      danger: '#F0907F',
    },
  },
  madinah: {
    scheme: 'dark',
    pattern: 'petals',
    patternColor: '#D8C38A',
    colors: {
      text: '#EEF3E8',
      background: '#123528',
      backgroundElement: '#1A4434',
      backgroundSelected: '#23553F',
      textSecondary: '#B5C7B8',
      border: '#2A5544',
      accent: '#D8C38A',
      onAccent: '#123528',
      danger: '#F0A090',
    },
  },
  midnight: {
    scheme: 'dark',
    pattern: 'stars',
    patternColor: '#C9D6F2',
    colors: {
      text: '#E6ECF8',
      background: '#0A1630',
      backgroundElement: '#13234A',
      backgroundSelected: '#1C2F5E',
      textSecondary: '#9FB0D3',
      border: '#22355F',
      accent: '#9DB8FF',
      onAccent: '#0A1630',
      danger: '#FF9C8F',
    },
  },
  fanous: {
    scheme: 'dark',
    pattern: 'lattice',
    patternColor: '#E8A15A',
    colors: {
      text: '#F5E6D3',
      background: '#2A1712',
      backgroundElement: '#3A2219',
      backgroundSelected: '#4A2E22',
      textSecondary: '#CDB39A',
      border: '#4F3226',
      accent: '#F0B46A',
      onAccent: '#2A1712',
      danger: '#FF9E8A',
    },
  },
  sand: {
    scheme: 'light',
    pattern: 'dunes',
    patternColor: '#B5562E',
    colors: {
      text: '#3B2416',
      background: '#F3E7D3',
      backgroundElement: '#EADBC2',
      backgroundSelected: '#E0CDAE',
      textSecondary: '#7A5A44',
      border: '#D9C4A3',
      accent: '#A64C26',
      onAccent: '#FFFFFF',
      danger: '#A8321F',
    },
  },
  marble: {
    scheme: 'light',
    pattern: 'marble',
    patternColor: '#9C9384',
    colors: {
      text: '#2E2A24',
      background: '#FAF8F3',
      backgroundElement: '#F0EBE1',
      backgroundSelected: '#E5DECF',
      textSecondary: '#6E665A',
      border: '#DED6C6',
      accent: '#8F7128',
      onAccent: '#FFFFFF',
      danger: '#A8321F',
    },
  },
  andalus: {
    scheme: 'light',
    pattern: 'zellige',
    patternColor: '#1F7A72',
    colors: {
      text: '#123B3A',
      background: '#F2F1EA',
      backgroundElement: '#E5EAE4',
      backgroundSelected: '#D6E0D9',
      textSecondary: '#4F6E6A',
      border: '#CBD8D1',
      accent: '#1F7A72',
      onAccent: '#FFFFFF',
      danger: '#A8321F',
    },
  },
} as const satisfies Record<
  string,
  { scheme: 'light' | 'dark'; pattern: PatternId; patternColor: string; colors: Palette }
>;

export type ThemePackId = keyof typeof THEME_PACKS;
export const THEME_PACK_IDS = Object.keys(THEME_PACKS) as ThemePackId[];

/**
 * The app's typefaces, by the names they are loaded under in the root layout. Each weight is its
 * own font file, so text picks a family here instead of setting `fontWeight`.
 */
export const AppFonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  /** Headings and the app name. */
  display: 'Marcellus_400Regular',
  /** Arabic dhikr text. */
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Space to leave at the bottom of a screen for the tab bar. Only iOS needs it: there the screen runs
 * on under the tab bar. On Android the native tabs already end each screen above the tab bar.
 */
export const BottomTabInset = Platform.select({ ios: 50 }) ?? 0;
export const MaxContentWidth = 800;
/** Height of the floating tab bar that sits above the content on web. */
export const TopTabInset = Platform.select({ web: 72 }) ?? 0;
