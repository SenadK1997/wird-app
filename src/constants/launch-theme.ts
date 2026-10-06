/**
 * Colours and fonts of the launch and welcome screens. They keep their own dark look whatever
 * theme and accent the user picks, so the first thing people see is always the same.
 */
export const LaunchColors = {
  background: '#0E2621',
  surface: '#13302A',
  border: '#24463E',
  track: '#1E3E37',
  accent: '#C9A45C',
  onAccent: '#0E2621',
  text: '#F3EBDD',
  textSoft: '#D9CDB6',
  textMuted: '#B8C4BC',
  textFaint: '#8FA39A',
} as const;

// Names as registered by useFonts in the root layout.
export const LaunchFonts = {
  display: 'Marcellus_400Regular',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
} as const;
