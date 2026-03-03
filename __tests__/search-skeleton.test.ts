import { describe, it, expect } from "vitest";

/**
 * Tests for the search loading skeleton and browse screen loading logic.
 * Since we can't render React Native components in vitest, we test the
 * loading state logic that drives when the skeleton appears.
 */

describe("Search loading state logic", () => {
  // Mirrors the logic in browse.tsx:
  // showLoading = isSearching && (isSearchLoading || (debouncedQuery !== query.trim() && query.trim().length >= 2))

  function computeShowLoading(
    query: string,
    debouncedQuery: string,
    isSearchLoading: boolean
  ): boolean {
    const isSearching = query.trim().length >= 2;
    return isSearching && (
      isSearchLoading || (debouncedQuery !== query.trim() && query.trim().length >= 2)
    );
  }

  it("should not show loading when query is empty", () => {
    expect(computeShowLoading("", "", false)).toBe(false);
  });

  it("should not show loading when query is only 1 character", () => {
    expect(computeShowLoading("a", "", false)).toBe(false);
  });

  it("should show loading when query >= 2 chars and search is loading", () => {
    expect(computeShowLoading("wh", "wh", true)).toBe(true);
  });

  it("should show loading when debounced query hasn't caught up yet", () => {
    // User typed "whiskey" but debounce still has old value "wh"
    expect(computeShowLoading("whiskey", "wh", false)).toBe(true);
  });

  it("should not show loading when debounced query matches and search is done", () => {
    expect(computeShowLoading("whiskey", "whiskey", false)).toBe(false);
  });

  it("should show loading during initial search (debounced still empty)", () => {
    expect(computeShowLoading("bo", "", false)).toBe(true);
  });

  it("should show loading when both debounce mismatch and search loading", () => {
    expect(computeShowLoading("vodka", "vo", true)).toBe(true);
  });

  it("should not show loading after clearing query", () => {
    expect(computeShowLoading("", "vodka", false)).toBe(false);
  });

  it("should handle whitespace-only queries as not searching", () => {
    expect(computeShowLoading("   ", "", false)).toBe(false);
  });

  it("should handle query with leading/trailing spaces correctly", () => {
    // "  rum  " trims to "rum" which is >= 2 chars
    expect(computeShowLoading("  rum  ", "rum", false)).toBe(false);
    expect(computeShowLoading("  rum  ", "ru", false)).toBe(true);
  });
});

describe("SearchLoadingSkeleton component structure", () => {
  it("skeleton file should exist at the expected path", async () => {
    // We can't import the component directly in vitest because it uses
    // react-native-reanimated which doesn't parse in the test environment.
    // Instead, verify the logic contract: the skeleton is shown when
    // showLoading is true, which is fully tested above.
    const fs = await import("fs");
    const exists = fs.existsSync("components/search-loading-skeleton.tsx");
    expect(exists).toBe(true);
  });
});
