import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

/**
 * A single skeleton row that mimics the ProductListItem layout in the category screen.
 * Matches: 80x80 image, brand/name/volume/rating/price text lines, heart icon, tags.
 */
function SkeletonListItem({ delay }: { delay: number }) {
  const colors = useColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  const bg = colors.muted + "25";

  return (
    <View style={[skStyles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Image placeholder */}
      <Animated.View style={[skStyles.image, { backgroundColor: bg }, animatedStyle]} />

      {/* Text area */}
      <View style={skStyles.info}>
        {/* Brand */}
        <Animated.View style={[skStyles.lineBrand, { backgroundColor: bg }, animatedStyle]} />
        {/* Name line 1 */}
        <Animated.View style={[skStyles.lineName, { backgroundColor: bg }, animatedStyle]} />
        {/* Volume + rating row */}
        <View style={skStyles.metaRow}>
          <Animated.View style={[skStyles.lineVolume, { backgroundColor: bg }, animatedStyle]} />
          <Animated.View style={[skStyles.lineRating, { backgroundColor: bg }, animatedStyle]} />
        </View>
        {/* Price + tags row */}
        <View style={skStyles.bottomRow}>
          <Animated.View style={[skStyles.linePrice, { backgroundColor: bg }, animatedStyle]} />
          <View style={skStyles.tagsRow}>
            <Animated.View style={[skStyles.tagBox, { backgroundColor: bg }, animatedStyle]} />
            <Animated.View style={[skStyles.tagBox, { backgroundColor: bg }, animatedStyle]} />
          </View>
        </View>
      </View>

      {/* Heart placeholder */}
      <Animated.View style={[skStyles.heart, { backgroundColor: bg }, animatedStyle]} />
    </View>
  );
}

/**
 * Sort bar skeleton — shows 4 pill placeholders matching the sort chips.
 */
function SortBarSkeleton() {
  const colors = useColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  const bg = colors.muted + "25";

  return (
    <View style={skStyles.sortBar}>
      {[70, 80, 85, 75].map((w, i) => (
        <Animated.View
          key={i}
          style={[skStyles.sortPill, { width: w, backgroundColor: bg }, animatedStyle]}
        />
      ))}
    </View>
  );
}

/**
 * Full category screen skeleton — sort bar + 6 product list item placeholders.
 * Renders with staggered delays for a natural cascade shimmer effect.
 */
export function CategoryListSkeleton() {
  return (
    <View style={skStyles.container}>
      <SortBarSkeleton />
      <View style={skStyles.list}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonListItem key={i} delay={i * 80} />
        ))}
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  sortPill: {
    height: 32,
    borderRadius: 20,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  item: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
    gap: 12,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  lineBrand: {
    width: 55,
    height: 10,
    borderRadius: 4,
  },
  lineName: {
    width: "85%",
    height: 13,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lineVolume: {
    width: 45,
    height: 10,
    borderRadius: 4,
  },
  lineRating: {
    width: 32,
    height: 10,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  linePrice: {
    width: 52,
    height: 15,
    borderRadius: 4,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 4,
  },
  tagBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  heart: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 4,
  },
});
