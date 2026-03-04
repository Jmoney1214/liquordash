import { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface FadeInProps {
  children: React.ReactNode;
  /** Animation duration in ms. Defaults to 200. */
  duration?: number;
  /** Optional delay before the animation starts, in ms. */
  delay?: number;
  /** Additional style applied to the animated wrapper. */
  style?: ViewStyle;
}

/**
 * Wraps children in an Animated.View that fades from opacity 0 → 1 on mount.
 * Used to smooth the transition when skeleton loading resolves to real content.
 *
 * Usage:
 * ```tsx
 * {isLoading ? <Skeleton /> : (
 *   <FadeIn>
 *     <RealContent />
 *   </FadeIn>
 * )}
 * ```
 */
export function FadeIn({ children, duration = 200, delay = 0, style }: FadeInProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = delay > 0
      ? setTimeout(() => {
          opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.ease) });
        }, delay)
      : (() => {
          opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.ease) });
          return undefined;
        })();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
