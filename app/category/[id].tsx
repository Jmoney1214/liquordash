import { FlatList, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFavorites } from "@/lib/favorites-store";
import { useCart } from "@/lib/cart-store";
import {
  CATEGORIES,
  getProductsByCategory,
  Product,
  formatPrice,
  Category,
} from "@/lib/data";
import { useProductsByCategory, useCategories } from "@/hooks/use-api";

type SortOption = "popular" | "price-low" | "price-high" | "rating";

function ProductListItem({ product }: { product: Product }) {
  const router = useRouter();
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(product.id);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.id}` as any)}
      style={[styles.productItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <Image source={product.imageUrl} style={styles.productImage} contentFit="cover" transition={200} />
      <View style={styles.productInfo}>
        <Text style={[styles.productBrand, { color: colors.muted }]}>{product.brand}</Text>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productMeta}>
          <Text style={[styles.productVolume, { color: colors.muted }]}>{product.volume}</Text>
          <View style={styles.ratingRow}>
            <IconSymbol name="star.fill" size={12} color={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.muted }]}>{product.rating}</Text>
          </View>
        </View>
        <View style={styles.productBottom}>
          <Text style={[styles.productPrice, { color: colors.foreground }]}>{formatPrice(product.price)}</Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {product.expressAvailable && (
              <View style={[styles.tag, { backgroundColor: colors.success + "18" }]}>
                <IconSymbol name="bolt.fill" size={10} color={colors.success} />
              </View>
            )}
            {product.shippingAvailable && (
              <View style={[styles.tag, { backgroundColor: colors.primary + "18" }]}>
                <IconSymbol name="shippingbox.fill" size={10} color={colors.primary} />
              </View>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(product.id)} style={styles.favBtn} activeOpacity={0.6}>
        <IconSymbol name={fav ? "heart.fill" : "heart"} size={20} color={fav ? colors.error : colors.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [sort, setSort] = useState<SortOption>("popular");

  const { categories } = useCategories();
  const { products: catProducts } = useProductsByCategory(id as string);
  const category = categories.find((c) => c.id === id);
  const products = useMemo(() => {
    const items = catProducts;
    switch (sort) {
      case "price-low":
        return [...items].sort((a, b) => a.price - b.price);
      case "price-high":
        return [...items].sort((a, b) => b.price - a.price);
      case "rating":
        return [...items].sort((a, b) => b.rating - a.rating);
      default:
        return items;
    }
  }, [catProducts, sort]);

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "popular", label: "Popular" },
    { key: "price-low", label: "Price: Low" },
    { key: "price-high", label: "Price: High" },
    { key: "rating", label: "Top Rated" },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{category?.icon || "🍷"}</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {category?.name || "Category"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <FlatList
          data={sortOptions}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSort(item.key)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: sort === item.key ? colors.primary : colors.surface,
                  borderColor: sort === item.key ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sort === item.key ? "#fff" : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductListItem product={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No products in this category yet</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  headerEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  sortBar: {
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  productItem: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productBrand: {
    fontSize: 11,
    fontWeight: "500",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  productVolume: {
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  tag: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  favBtn: {
    justifyContent: "center",
    paddingLeft: 4,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
});
