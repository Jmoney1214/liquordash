import { useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
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
 * A single skeleton card that mimics the ProductCard layout.
 * Matches dimensions: 160w card, 140h image, plus info section.
 */
function SkeletonCard({ delay }: { delay: number }) {
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

  const skeletonBg = colors.muted + "25";

  return (
    <View style={[skStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Image placeholder */}
      <Animated.View
        style={[skStyles.imagePlaceholder, { backgroundColor: skeletonBg }, animatedStyle]}
      />
      {/* Info section */}
      <View style={skStyles.info}>
        {/* Brand line */}
        <Animated.View
          style={[skStyles.lineBrand, { backgroundColor: skeletonBg }, animatedStyle]}
        />
        {/* Name line 1 */}
        <Animated.View
          style={[skStyles.lineName, { backgroundColor: skeletonBg }, animatedStyle]}
        />
        {/* Name line 2 (shorter) */}
        <Animated.View
          style={[skStyles.lineNameShort, { backgroundColor: skeletonBg }, animatedStyle]}
        />
        {/* Price + rating row */}
        <View style={skStyles.bottomRow}>
          <Animated.View
            style={[skStyles.linePrice, { backgroundColor: skeletonBg }, animatedStyle]}
          />
          <Animated.View
            style={[skStyles.lineRating, { backgroundColor: skeletonBg }, animatedStyle]}
          />
        </View>
        {/* Express tag placeholder */}
        <Animated.View
          style={[skStyles.lineTag, { backgroundColor: skeletonBg }, animatedStyle]}
        />
      </View>
    </View>
  );
}

/**
 * A horizontal row of skeleton product cards with a section title placeholder.
 * Renders 4 shimmer cards that match the ProductCard layout, scrollable horizontally.
 */
export function ProductRowSkeleton({ showTitle = true }: { showTitle?: boolean }) {
  const colors = useColors();

  return (
    <View style={skStyles.container}>
      {showTitle && (
        <View style={skStyles.headerRow}>
          <SkeletonTitleLine />
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        scrollEnabled={false}
      >
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} delay={i * 100} />
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * A shimmer line used as a section title placeholder.
 */
function SkeletonTitleLine() {
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

  const skeletonBg = colors.muted + "25";

  return (
    <Animated.View
      style={[skStyles.titleLine, { backgroundColor: skeletonBg }, animatedStyle]}
    />
  );
}

const skStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleLine: {
    width: 140,
    height: 20,
    borderRadius: 6,
  },
  card: {
    width: 160,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: 140,
  },
  info: {
    padding: 10,
    gap: 6,
  },
  lineBrand: {
    width: 55,
    height: 10,
    borderRadius: 4,
  },
  lineName: {
    width: "90%",
    height: 12,
    borderRadius: 4,
  },
  lineNameShort: {
    width: "60%",
    height: 12,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  linePrice: {
    width: 48,
    height: 14,
    borderRadius: 4,
  },
  lineRating: {
    width: 32,
    height: 10,
    borderRadius: 4,
  },
  lineTag: {
    width: 56,
    height: 16,
    borderRadius: 4,
    marginTop: 2,
  },
});
