import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { AppFonts, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { rtl } = useI18n();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        rtl && styles.rtl,
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Weight comes from the font family, not fontWeight: each Manrope weight is a separate file.
const styles = StyleSheet.create({
  rtl: {
    writingDirection: 'rtl',
  },
  small: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: AppFonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: AppFonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: AppFonts.display,
    fontSize: 48,
    lineHeight: 56,
  },
  subtitle: {
    fontFamily: AppFonts.display,
    fontSize: 32,
    lineHeight: 44,
    letterSpacing: 0.5,
  },
  link: {
    fontFamily: AppFonts.medium,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: AppFonts.medium,
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
