import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';

import { THEME_PACKS, type PatternId, type ThemePackId } from '@/constants/theme';

/** How strongly the pattern shows: a texture to notice, never something to read through. */
const OPACITY = { dark: 0.14, light: 0.08 } as const;

/** One tile of each pattern, drawn in a 48×48 box and repeated over the whole background. */
function Tile({ id, color }: { id: PatternId; color: string }) {
  const line = { fill: 'none', stroke: color, strokeWidth: 0.8 } as const;
  switch (id) {
    case 'diamonds':
      // Kiswa: a fine gold lattice of diamonds.
      return (
        <G>
          <Path d="M24 2L46 24L24 46L2 24Z" {...line} />
          <Path d="M24 14L34 24L24 34L14 24Z" {...line} strokeWidth={0.5} />
        </G>
      );
    case 'stars':
      // Midnight blue: a scatter of small stars.
      return (
        <G fill={color}>
          <Circle cx={6} cy={8} r={0.9} />
          <Circle cx={30} cy={4} r={0.6} />
          <Circle cx={40} cy={20} r={1.1} />
          <Circle cx={16} cy={28} r={0.6} />
          <Circle cx={34} cy={38} r={0.8} />
          <Circle cx={8} cy={42} r={0.5} />
          <Path d="M22 14l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" />
        </G>
      );
    case 'dunes':
      // Desert sand: soft lines of dunes.
      return (
        <G>
          <Path d="M0 16Q12 10 24 16T48 16" {...line} />
          <Path d="M0 36Q12 30 24 36T48 36" {...line} />
        </G>
      );
    case 'petals':
      // Madinah green: four arabesque petals around a point.
      return (
        <G>
          <Path d="M24 4Q34 14 24 24Q14 14 24 4Z" {...line} />
          <Path d="M24 44Q34 34 24 24Q14 34 24 44Z" {...line} />
          <Path d="M4 24Q14 14 24 24Q14 34 4 24Z" {...line} />
          <Path d="M44 24Q34 14 24 24Q34 34 44 24Z" {...line} />
        </G>
      );
    case 'lattice':
      // Fanous: a mashrabiya screen of rings and diagonals.
      return (
        <G>
          <Circle cx={24} cy={24} r={15} {...line} />
          <Path d="M0 0L48 48M48 0L0 48" {...line} strokeWidth={0.5} />
          <Circle cx={0} cy={0} r={9} {...line} />
          <Circle cx={48} cy={0} r={9} {...line} />
          <Circle cx={0} cy={48} r={9} {...line} />
          <Circle cx={48} cy={48} r={9} {...line} />
        </G>
      );
    case 'marble':
      // Haram marble: faint grey veins.
      return (
        <G>
          <Path d="M0 10C14 14 20 4 32 12S44 8 48 14" {...line} strokeWidth={0.6} />
          <Path d="M0 34C12 30 22 40 34 34S44 36 48 32" {...line} strokeWidth={0.5} />
        </G>
      );
    case 'zellige':
      // Andalus: eight-point zellige stars with a small terracotta square.
      return (
        <G>
          <Path d="M24 6L29 19L42 24L29 29L24 42L19 29L6 24L19 19Z" fill={color} fillOpacity={0.55} />
          <Rect x={21.5} y={21.5} width={5} height={5} fill="#C2703D" />
        </G>
      );
  }
}

type Props = { pack: ThemePackId; style?: StyleProp<ViewStyle> };

/**
 * The theme's pattern, filling its parent behind everything else. Ignores touches, so it never
 * gets in the way of the counter.
 */
export function ThemePattern({ pack, style }: Props) {
  const { pattern, patternColor, scheme } = THEME_PACKS[pack];
  // Unique per drawing: on the web several can be on the page at once, and ids are page-wide.
  const id = `wird-pattern-${pack}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: OPACITY[scheme] }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={48} height={48}>
            <Tile id={pattern} color={patternColor} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
