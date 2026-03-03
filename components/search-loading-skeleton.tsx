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
 * A single shimmer row that mimics a search result item.
 */
function SkeletonRow({ delay }: { delay: number }) {
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
    <View style={styles.row}>
      {/* Image placeholder */}
      <Animated.View
        style={[
          styles.imagePlaceholder,
          { backgroundColor: skeletonBg },
          animatedStyle,
        ]}
      />
      {/* Text placeholders */}
      <View style={styles.textArea}>
        <Animated.View
          style={[
            styles.lineBrand,
            { backgroundColor: skeletonBg },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.lineName,
            { backgroundColor: skeletonBg },
            animatedStyle,
          ]}
        />
        <View style={styles.bottomRow}>
          <Animated.View
            style={[
              styles.linePrice,
              { backgroundColor: skeletonBg },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.lineRating,
              { backgroundColor: skeletonBg },
              animatedStyle,
            ]}
          />
        </View>
        <View style={styles.tagsRow}>
          <Animated.View
            style={[
              styles.lineTag,
              { backgroundColor: skeletonBg },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.lineTag,
              { backgroundColor: skeletonBg, width: 40 },
              animatedStyle,
            ]}
          />
        </View>
      </View>
      {/* Heart placeholder */}
      <Animated.View
        style={[
          styles.heartPlaceholder,
          { backgroundColor: skeletonBg },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Skeleton loading state shown while search results are being fetched.
 * Renders 5 shimmer rows that match the SearchResultItem layout.
 */
export function SearchLoadingSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i}>
          <SkeletonRow delay={i * 80} />
          {i < 4 && (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
    alignItems: "center",
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  textArea: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  lineBrand: {
    width: 60,
    height: 10,
    borderRadius: 4,
  },
  lineName: {
    width: "80%",
    height: 13,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linePrice: {
    width: 50,
    height: 14,
    borderRadius: 4,
  },
  lineRating: {
    width: 30,
    height: 10,
    borderRadius: 4,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  lineTag: {
    width: 50,
    height: 16,
    borderRadius: 4,
  },
  heartPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
  },
  separator: {
    height: 1,
  },
});
