import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Thin horizontal bar; `progress` is 0 to 1. */
export function ProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { backgroundColor: theme.accent, width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
