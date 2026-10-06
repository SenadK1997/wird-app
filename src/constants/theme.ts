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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
/** Height of the floating tab bar that sits above the content on web. */
export const TopTabInset = Platform.select({ web: 72 }) ?? 0;
