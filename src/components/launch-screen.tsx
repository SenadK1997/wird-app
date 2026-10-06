import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { StarMark } from '@/components/star-mark';
import { LaunchColors, LaunchFonts } from '@/constants/launch-theme';
import { NATIVE_DRIVER } from '@/utils/animation';
import { useI18n } from '@/i18n';

type Phase = 'splash' | 'loading' | 'skeleton';

/** How long each part of the launch sequence stays on screen, in order. */
const PHASES: { phase: Phase; ms: number }[] = [
  { phase: 'splash', ms: 2000 },
  { phase: 'loading', ms: 2800 },
  { phase: 'skeleton', ms: 900 },
];
const FADE_MS = 350;

/**
 * The launch sequence shown over the app at start-up: the Wird mark, the bead ring, then an
 * outline of the home screen. Tapping anywhere skips straight to the app.
 */
export function LaunchScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const opacity = useState(() => new Animated.Value(1))[0];

  // Step through the phases, then start leaving.
  useEffect(() => {
    if (leaving) return;
    const timer = setTimeout(() => {
      if (index < PHASES.length - 1) setIndex(index + 1);
      else setLeaving(true);
    }, PHASES[index].ms);
    return () => clearTimeout(timer);
  }, [index, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const fade = Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: NATIVE_DRIVER,
    });
    fade.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => fade.stop();
  }, [leaving, opacity, onDone]);

  const phase = PHASES[index].phase;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Pressable
        style={styles.fill}
        onPress={() => setLeaving(true)}
        accessibilityRole="button"
        accessibilityLabel={t('start')}>
        {/* Keyed so each phase fades in as it replaces the one before. */}
        <FadeIn key={phase}>
          {phase === 'splash' ? <Splash /> : phase === 'loading' ? <Loading /> : <Skeleton />}
        </FadeIn>
      </Pressable>
    </Animated.View>
  );
}

function FadeIn({ children }: { children: ReactNode }) {
  const opacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const fade = Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: NATIVE_DRIVER });
    fade.start();
    return () => fade.stop();
  }, [opacity]);

  return <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>;
}

/** Loops a value from 0 to 1 over `duration` for as long as the component is mounted. */
function useLoop(duration: number, easing = Easing.linear) {
  const value = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: NATIVE_DRIVER })
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, easing]);

  return value;
}

// ---- 1. Splash: the mark, the name, and the bismillah -------------------------------------------

function Splash() {
  return (
    <View style={styles.splash}>
      <View style={styles.spacer} />
      <View style={styles.brand}>
        <StarMark />
        <View style={styles.names}>
          <Text style={styles.title}>Wird</Text>
          <Text style={styles.tagline}>Daily dhikr & tasbih</Text>
        </View>
      </View>
      <View style={styles.splashFooter}>
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
        <Text style={styles.bismillah}>بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const pulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, { toValue: 1, duration: 560, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0, duration: 560, useNativeDriver: NATIVE_DRIVER }),
        Animated.delay(280 - delay / 2),
      ])
    );
    pulsing.start();
    return () => pulsing.stop();
  }, [pulse, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        },
      ]}
    />
  );
}

// ---- 2. Loading: a light travelling round a ring of 33 beads -------------------------------------

const RING_SIZE = 260;
const RING_RADIUS = 110;
const BEAD_COUNT = 33;
const BAR_WIDTH = 220;

/** Brightness of a bead over one lap, starting from the moment the light reaches it. */
const BEAD_GLOW = [
  { at: 0, opacity: 0.2 },
  { at: 0.08, opacity: 1 },
  { at: 0.3, opacity: 0.2 },
  { at: 1, opacity: 0.2 },
];

function glowAt(local: number) {
  for (let i = 1; i < BEAD_GLOW.length; i++) {
    const from = BEAD_GLOW[i - 1];
    const to = BEAD_GLOW[i];
    if (local <= to.at) {
      return from.opacity + ((local - from.at) / (to.at - from.at)) * (to.opacity - from.opacity);
    }
  }
  return BEAD_GLOW[0].opacity;
}

/** The same glow curve shifted to start at `offset` of the lap, as an interpolation over 0 to 1. */
function beadOpacityRange(offset: number) {
  const points = new Set([0, 1]);
  for (const { at } of BEAD_GLOW) points.add(Number(((offset + at) % 1).toFixed(4)));
  const inputRange = [...points].sort((a, b) => a - b);
  const outputRange = inputRange.map((time) => glowAt((((time - offset) % 1) + 1) % 1));
  return { inputRange, outputRange };
}

const BEADS = Array.from({ length: BEAD_COUNT }, (_, i) => {
  const angle = (i / BEAD_COUNT) * Math.PI * 2 - Math.PI / 2;
  // The first bead is the larger lead bead.
  const radius = i === 0 ? 8 : 5.5;
  return {
    radius,
    left: RING_SIZE / 2 + RING_RADIUS * Math.cos(angle) - radius,
    top: RING_SIZE / 2 + RING_RADIUS * Math.sin(angle) - radius,
    range: beadOpacityRange(i / BEAD_COUNT),
  };
});

function Loading() {
  const { t } = useI18n();
  const lap = useLoop(2400);
  const bar = useLoop(1800, Easing.inOut(Easing.ease));
  const quote = t('quote');

  return (
    <View style={styles.loading}>
      <Text style={styles.smallTitle}>Wird</Text>

      <View style={styles.loadingCentre}>
        <View style={styles.ring}>
          <View style={styles.ringLine} />
          {BEADS.map((bead, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: bead.left,
                top: bead.top,
                width: bead.radius * 2,
                height: bead.radius * 2,
                borderRadius: bead.radius,
                backgroundColor: LaunchColors.accent,
                opacity: lap.interpolate(bead.range),
              }}
            />
          ))}
          <View style={styles.ringCentre}>
            <Text style={styles.ringArabic}>سُبْحَانَ ٱللَّٰهِ</Text>
            <Text style={styles.ringLabel}>SubhanAllah</Text>
          </View>
        </View>

        <View style={styles.preparing}>
          <Text style={styles.preparingText}>{t('preparing')}</Text>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  transform: [
                    {
                      translateX: bar.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-BAR_WIDTH * 0.4, BAR_WIDTH],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.quoteCard}>
        <Text style={styles.quoteArabic}>أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ</Text>
        {quote ? <Text style={styles.quoteText}>{quote}</Text> : null}
        <Text style={styles.quoteReference}>Ar-Ra‘d 13:28</Text>
      </View>
    </View>
  );
}

// ---- 3. Skeleton: an outline of the home screen --------------------------------------------------

const SHIMMER_WIDTH = 120;

type BlockProps = { sweep: Animated.Value; style: StyleProp<ViewStyle>; children?: ReactNode };

/** A placeholder shape with a soft band of light passing across it. */
function Block({ sweep, style, children }: BlockProps) {
  return (
    <View style={[styles.block, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [
              { translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-SHIMMER_WIDTH, 300] }) },
            ],
          },
        ]}>
        <Svg width={SHIMMER_WIDTH} height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.07} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#shimmer)" />
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
}

function Skeleton() {
  const sweep = useLoop(1400);
  const block = (style: ViewStyle) => <Block sweep={sweep} style={style} />;

  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonHeaderText}>
          {block({ width: 120, height: 12, borderRadius: 6 })}
          {block({ width: 190, height: 22, borderRadius: 8 })}
        </View>
        {block({ width: 44, height: 44, borderRadius: 22 })}
      </View>

      <View style={styles.skeletonRing}>
        <Block sweep={sweep} style={styles.skeletonRingOuter}>
          <View style={styles.skeletonRingInner} />
        </Block>
        {block({ width: 140, height: 14, borderRadius: 7 })}
      </View>

      <View style={styles.skeletonPills}>
        {block({ flex: 1, height: 36, borderRadius: 18 })}
        {block({ flex: 1, height: 36, borderRadius: 18 })}
        {block({ flex: 1, height: 36, borderRadius: 18 })}
      </View>

      <View style={styles.skeletonRows}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.skeletonRow}>
            {block({ width: 44, height: 44, borderRadius: 12 })}
            <View style={styles.skeletonRowText}>
              {block({ width: '70%', height: 14, borderRadius: 7 })}
              {block({ width: '40%', height: 10, borderRadius: 5 })}
            </View>
            {block({ width: 36, height: 20, borderRadius: 10 })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: LaunchColors.background,
  },
  fill: {
    flex: 1,
  },

  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 96,
    paddingBottom: 64,
    paddingHorizontal: 32,
  },
  spacer: {
    height: 24,
  },
  brand: {
    alignItems: 'center',
    gap: 28,
  },
  names: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: LaunchFonts.display,
    fontSize: 44,
    letterSpacing: 3.5,
    color: LaunchColors.text,
  },
  tagline: {
    fontFamily: LaunchFonts.body,
    fontSize: 14,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: LaunchColors.textMuted,
  },
  splashFooter: {
    alignItems: 'center',
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LaunchColors.accent,
  },
  bismillah: {
    fontFamily: LaunchFonts.arabic,
    fontSize: 22,
    lineHeight: 40,
    color: LaunchColors.textSoft,
    writingDirection: 'rtl',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 88,
    paddingBottom: 56,
    paddingHorizontal: 32,
  },
  smallTitle: {
    fontFamily: LaunchFonts.display,
    fontSize: 22,
    letterSpacing: 1.8,
    color: LaunchColors.textSoft,
  },
  loadingCentre: {
    alignItems: 'center',
    gap: 36,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringLine: {
    position: 'absolute',
    left: RING_SIZE / 2 - RING_RADIUS,
    top: RING_SIZE / 2 - RING_RADIUS,
    width: RING_RADIUS * 2,
    height: RING_RADIUS * 2,
    borderRadius: RING_RADIUS,
    borderWidth: 1,
    borderColor: LaunchColors.track,
  },
  ringCentre: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ringArabic: {
    fontFamily: LaunchFonts.arabic,
    fontSize: 30,
    lineHeight: 52,
    color: LaunchColors.accent,
    writingDirection: 'rtl',
  },
  ringLabel: {
    fontFamily: LaunchFonts.body,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: LaunchColors.textMuted,
  },
  preparing: {
    width: BAR_WIDTH,
    alignItems: 'center',
    gap: 14,
  },
  preparingText: {
    fontFamily: LaunchFonts.bodyMedium,
    fontSize: 16,
    textAlign: 'center',
    color: LaunchColors.text,
  },
  barTrack: {
    width: BAR_WIDTH,
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: LaunchColors.track,
  },
  barFill: {
    width: BAR_WIDTH * 0.4,
    height: 3,
    borderRadius: 3,
    backgroundColor: LaunchColors.accent,
  },
  quoteCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: LaunchColors.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  quoteArabic: {
    fontFamily: LaunchFonts.arabic,
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    color: LaunchColors.textSoft,
    writingDirection: 'rtl',
  },
  quoteText: {
    fontFamily: LaunchFonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: LaunchColors.textMuted,
  },
  quoteReference: {
    fontFamily: LaunchFonts.body,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: LaunchColors.textFaint,
  },

  skeleton: {
    flex: 1,
    gap: 28,
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  block: {
    backgroundColor: '#1A3730',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SHIMMER_WIDTH,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonHeaderText: {
    gap: 10,
  },
  skeletonRing: {
    alignItems: 'center',
    gap: 18,
    paddingVertical: 12,
  },
  skeletonRingOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRingInner: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: LaunchColors.background,
  },
  skeletonPills: {
    flexDirection: 'row',
    gap: 10,
  },
  skeletonRows: {
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: LaunchColors.surface,
  },
  skeletonRowText: {
    flex: 1,
    gap: 8,
  },
});
