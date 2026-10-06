/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#14201B',
    background: '#FAF8F3',
    backgroundElement: '#F0EDE4',
    backgroundSelected: '#E4DFD2',
    textSecondary: '#60646C',
    accent: '#0B6E4F',
    onAccent: '#ffffff',
    danger: '#B42318',
  },
  dark: {
    text: '#F2F5F3',
    background: '#0C1210',
    backgroundElement: '#18211E',
    backgroundSelected: '#24302B',
    textSecondary: '#B0B4BA',
    accent: '#3DDC97',
    onAccent: '#06281C',
    danger: '#F97066',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Accent colours the user can pick from; each replaces `accent` and `onAccent`. */
export const Accents = {
  green: {
    light: { accent: '#0B6E4F', onAccent: '#ffffff' },
    dark: { accent: '#3DDC97', onAccent: '#06281C' },
  },
  blue: {
    light: { accent: '#1D4ED8', onAccent: '#ffffff' },
    dark: { accent: '#7AA7FF', onAccent: '#0A1A3D' },
  },
  gold: {
    light: { accent: '#8A6100', onAccent: '#ffffff' },
    dark: { accent: '#F2C14E', onAccent: '#2B1E00' },
  },
  plum: {
    light: { accent: '#7A2E6E', onAccent: '#ffffff' },
    dark: { accent: '#E29AD6', onAccent: '#33102D' },
  },
} as const;

export type AccentId = keyof typeof Accents;
export type ThemeMode = 'system' | 'light' | 'dark';

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
