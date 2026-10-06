import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const { rtl } = useI18n();

  return (
    <View
      // Every screen and dialog is rooted in a ThemedView, so this mirrors the layout for
      // right-to-left languages without needing the app to restart.
      style={[{ backgroundColor: theme[type ?? 'background'], direction: rtl ? 'rtl' : 'ltr' }, style]}
      {...otherProps}
    />
  );
}
