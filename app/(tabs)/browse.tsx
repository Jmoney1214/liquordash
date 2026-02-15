import { FlatList, Text, View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  CATEGORIES,
  PRODUCTS,
  searchProducts,
  Product,
  formatPrice,
  CategoryInfo,
} from "@/lib/data";
import { useFavorites } from "@/lib/favorites-store";
import { useCart } from "@/lib/cart-store";

function CategoryTile({ cat, onPress }: { cat: CategoryInfo; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.catTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <Text style={styles.catEmoji}>{cat.icon}</Text>
      <Text style={[styles.catName, { color: colors.foreground }]}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

function SearchResultItem({ product }: { product: Product }) {
  const router = useRouter();
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(product.id);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.id}` as any)}
      style={[styles.resultItem, { borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <Image source={product.imageUrl} style={styles.resultImage} contentFit="cover" transition={200} />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultBrand, { color: colors.muted }]}>{product.brand}</Text>
        <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.resultBottom}>
          <Text style={[styles.resultPrice, { color: colors.foreground }]}>
            {formatPrice(product.price)}
          </Text>
          <View style={styles.resultRating}>
            <IconSymbol name="star.fill" size={12} color={colors.warning} />
            <Text style={[styles.resultRatingText, { color: colors.muted }]}>{product.rating}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
          {product.expressAvailable && (
            <View style={[styles.tag, { backgroundColor: colors.success + "18" }]}>
              <Text style={[styles.tagText, { color: colors.success }]}>Express</Text>
            </View>
          )}
          {product.shippingAvailable && (
            <View style={[styles.tag, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>Ships</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(product.id)} style={styles.resultFav} activeOpacity={0.6}>
        <IconSymbol name={fav ? "heart.fill" : "heart"} size={20} color={fav ? colors.error : colors.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function BrowseScreen() {
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchProducts(query.trim());
  }, [query]);

  const isSearching = query.trim().length >= 2;

  return (
    <ScreenContainer>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search spirits, brands, categories..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.6}>
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SearchResultItem product={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No results for "{query}"
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}
          ListHeaderComponent={
            <Text style={[styles.browseTitle, { color: colors.foreground }]}>Categories</Text>
          }
          renderItem={({ item }) => (
            <CategoryTile cat={item} onPress={() => router.push(`/category/${item.id}` as any)} />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  browseTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  catTile: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  catEmoji: {
    fontSize: 36,
  },
  catName: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultItem: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  resultImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultBrand: {
    fontSize: 11,
    fontWeight: "500",
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  resultBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  resultPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  resultRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  resultRatingText: {
    fontSize: 11,
  },
  resultFav: {
    justifyContent: "center",
    paddingLeft: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
});
