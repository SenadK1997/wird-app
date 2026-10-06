import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BAR_WIDTH = 4;
const MIN_THUMB = 28;

type ScrollAreaProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * A vertical scroll view with a scrollbar that stays visible whenever there is more to scroll.
 * The phone's own indicator only flashes while scrolling, so long text could look complete.
 */
export function ScrollArea({ children, style, contentContainerStyle }: ScrollAreaProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);

  // A pixel of slack, so rounding does not show a bar for text that fits.
  const scrollable = visible > 0 && content > visible + 1;
  const thumb = scrollable ? Math.max(MIN_THUMB, (visible / content) * visible) : 0;
  const travelled = scrollable ? Math.min(1, Math.max(0, offset / (content - visible))) : 0;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => setVisible(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => setContent(height)}
        onScroll={(event) => setOffset(event.nativeEvent.contentOffset.y)}
        // Room on both sides keeps the text centred and clear of the bar.
        contentContainerStyle={[contentContainerStyle, scrollable && styles.contentWithBar]}>
        {children}
      </ScrollView>
      {scrollable ? (
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[
              styles.thumb,
              { backgroundColor: theme.accent, height: thumb, top: travelled * (visible - thumb) },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Lets the scroll view shrink to the space its parent has left.
    overflow: 'hidden',
  },
  contentWithBar: {
    paddingHorizontal: BAR_WIDTH + Spacing.two,
  },
  track: {
    position: 'absolute',
    // Touches pass through to the text underneath.
    pointerEvents: 'none',
    top: 0,
    bottom: 0,
    right: 0,
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: BAR_WIDTH / 2,
  },
});
