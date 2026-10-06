// Each weight is imported from its own folder so only the fonts in use end up in the app.
import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { Amiri_700Bold } from '@expo-google-fonts/amiri/700Bold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus/400Regular';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { ConfirmProvider } from '@/components/confirm-dialog';
import { LaunchScreen } from '@/components/launch-screen';
import { Welcome } from '@/components/welcome';
import { useScheme } from '@/hooks/use-theme';
import { DhikrStoreProvider } from '@/store/dhikr-store';

// Kept up until the fonts and the saved counts are loaded; see ThemedApp.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Used by the launch and welcome screens. Names here are the fontFamily values in launch-theme.
  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Marcellus_400Regular,
  });

  // A font that fails to load falls back to the system font; it must not block the app.
  if (!fontsLoaded && !fontError) return null;

  return (
    // Renders nothing until the saved counts are loaded.
    <DhikrStoreProvider>
      <ThemedApp />
    </DhikrStoreProvider>
  );
}

// Separate from RootLayout because the theme comes from settings held in the store.
function ThemedApp() {
  const scheme = useScheme();
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    // Everything is ready by the time this mounts, and LaunchScreen is already covering the app.
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ConfirmProvider>
        <AppTabs />
      </ConfirmProvider>
      {/* The welcome screen waits for the launch sequence, so the two are never on top of each other. */}
      <Welcome ready={launched} />
      {launched ? null : <LaunchScreen onDone={() => setLaunched(true)} />}
    </ThemeProvider>
  );
}
