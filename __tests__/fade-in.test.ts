import { describe, it, expect } from "vitest";
import * as fs from "fs";

/**
 * Tests for the FadeIn component and its integration across skeleton screens.
 */

describe("FadeIn component structure", () => {
  it("should exist at the expected path", () => {
    expect(fs.existsSync("components/fade-in.tsx")).toBe(true);
  });

  it("should export FadeIn as a named export", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("export function FadeIn");
  });

  it("should use react-native-reanimated for opacity animation", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("react-native-reanimated");
    expect(content).toContain("useSharedValue");
    expect(content).toContain("useAnimatedStyle");
    expect(content).toContain("withTiming");
  });

  it("should animate opacity from 0 to 1", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("useSharedValue(0)");
    expect(content).toContain("opacity.value = withTiming(1");
  });

  it("should default to 200ms duration", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("duration = 200");
  });

  it("should support optional delay prop", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("delay");
    expect(content).toContain("setTimeout");
  });

  it("should use Easing.out for a natural deceleration curve", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("Easing.out");
  });

  it("should render children inside an Animated.View", () => {
    const content = fs.readFileSync("components/fade-in.tsx", "utf-8");
    expect(content).toContain("<Animated.View");
    expect(content).toContain("{children}");
  });
});

describe("FadeIn integration in Browse screen", () => {
  it("should import FadeIn component", () => {
    const content = fs.readFileSync("app/(tabs)/browse.tsx", "utf-8");
    expect(content).toContain("import { FadeIn }");
    expect(content).toContain("@/components/fade-in");
  });

  it("should wrap search results with FadeIn after skeleton resolves", () => {
    const content = fs.readFileSync("app/(tabs)/browse.tsx", "utf-8");
    // The pattern: showLoading ? <Skeleton /> : <FadeIn>...<FlatList />...</FadeIn>
    expect(content).toContain("<FadeIn>");
    expect(content).toContain("</FadeIn>");
  });
});

describe("FadeIn integration in Home screen", () => {
  it("should import FadeIn component", () => {
    const content = fs.readFileSync("app/(tabs)/index.tsx", "utf-8");
    expect(content).toContain("import { FadeIn }");
    expect(content).toContain("@/components/fade-in");
  });

  it("should wrap product row content with FadeIn after skeleton resolves", () => {
    const content = fs.readFileSync("app/(tabs)/index.tsx", "utf-8");
    expect(content).toContain("<FadeIn");
    expect(content).toContain("</FadeIn>");
  });
});

describe("FadeIn integration in Category screen", () => {
  it("should import FadeIn component", () => {
    const content = fs.readFileSync("app/category/[id].tsx", "utf-8");
    expect(content).toContain("import { FadeIn }");
    expect(content).toContain("@/components/fade-in");
  });

  it("should wrap category content with FadeIn after skeleton resolves", () => {
    const content = fs.readFileSync("app/category/[id].tsx", "utf-8");
    expect(content).toContain("<FadeIn>");
    expect(content).toContain("</FadeIn>");
  });
});
