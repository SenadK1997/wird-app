import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { LaunchColors, LaunchFonts } from '@/constants/launch-theme';
import { NATIVE_DRIVER } from '@/utils/animation';

const GLOW_SIZE = 168;
const STAR_SIZE = 140;

/** The Wird mark: a slowly turning eight-pointed star with a breathing glow and the name in Arabic. */
export function StarMark() {
  const spin = useState(() => new Animated.Value(0))[0];
  const glow = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const spinning = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER })
    );
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    spinning.start();
    breathing.start();
    return () => {
      spinning.stop();
      breathing.stop();
    };
  }, [spin, glow]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.fill,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.05] }) }],
          },
        ]}>
        <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={LaunchColors.accent} stopOpacity={0.35} />
              <Stop offset="0.7" stopColor={LaunchColors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#glow)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={{
          transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        }}>
        <Svg
          width={STAR_SIZE}
          height={STAR_SIZE}
          viewBox="0 0 100 100"
          fill="none"
          stroke={LaunchColors.accent}
          strokeWidth={1.6}
          strokeLinejoin="round">
          <Rect x={20} y={20} width={60} height={60} />
          <Rect x={20} y={20} width={60} height={60} transform="rotate(45 50 50)" />
          <Circle cx={50} cy={50} r={18} />
        </Svg>
      </Animated.View>

      <View style={[styles.fill, styles.centered]}>
        <Text style={styles.arabic}>وِرْد</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabic: {
    fontFamily: LaunchFonts.arabicBold,
    fontSize: 40,
    lineHeight: 64,
    paddingBottom: 6,
    color: LaunchColors.accent,
    writingDirection: 'rtl',
  },
});
