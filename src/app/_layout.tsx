import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { ConfirmProvider } from '@/components/confirm-dialog';
import { useScheme } from '@/hooks/use-theme';
import { DhikrStoreProvider } from '@/store/dhikr-store';

// Hidden by DhikrStoreProvider once the saved counts are loaded.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <DhikrStoreProvider>
      <ThemedApp />
    </DhikrStoreProvider>
  );
}

// Separate from RootLayout because the theme comes from settings held in the store.
function ThemedApp() {
  const scheme = useScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ConfirmProvider>
        <AppTabs />
      </ConfirmProvider>
    </ThemeProvider>
  );
}
