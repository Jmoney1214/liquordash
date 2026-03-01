import { FlatList, Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart-store";
import {
  PRODUCTS,
  getFeaturedProducts,
  getExpressProducts,
  getPremiumProducts,
  Product,
  formatPrice,
  DeliveryMode,
} from "@/lib/data";
import { useFeaturedProducts, useExpressProducts, usePremiumProducts, useProducts } from "@/hooks/use-api";
import { useFavorites } from "@/lib/favorites-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";
import { useMemo } from "react";

function DeliveryToggle() {
  const { deliveryMode, setDeliveryMode } = useCart();
  const colors = useColors();

  return (
    <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => setDeliveryMode("express")}
        style={[
          styles.toggleBtn,
          deliveryMode === "express" && { backgroundColor: colors.primary },
        ]}
        activeOpacity={0.7}
      >
        <IconSymbol name="bolt.fill" size={16} color={deliveryMode === "express" ? "#fff" : colors.muted} />
        <Text
          style={[
            styles.toggleText,
            { color: deliveryMode === "express" ? "#fff" : colors.muted },
          ]}
        >
          Express
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setDeliveryMode("shipping")}
        style={[
          styles.toggleBtn,
          deliveryMode === "shipping" && { backgroundColor: colors.primary },
        ]}
        activeOpacity={0.7}
      >
        <IconSymbol name="shippingbox.fill" size={16} color={deliveryMode === "shipping" ? "#fff" : colors.muted} />
        <Text
          style={[
            styles.toggleText,
            { color: deliveryMode === "shipping" ? "#fff" : colors.muted },
          ]}
        >
          Ship to Me
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const colors = useColors();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(product.id);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.id}` as any)}
      style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.productImageWrap}>
        <Image
          source={product.imageUrl}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />
        {product.premium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => toggleFavorite(product.id)}
          style={[styles.favBtn, { backgroundColor: colors.background + "CC" }]}
          activeOpacity={0.6}
        >
          <IconSymbol name={fav ? "heart.fill" : "heart"} size={18} color={fav ? colors.error : colors.muted} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productBrand, { color: colors.muted }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productBottom}>
          <Text style={[styles.productPrice, { color: colors.foreground }]}>
            {formatPrice(product.price)}
          </Text>
          <View style={styles.ratingRow}>
            <IconSymbol name="star.fill" size={12} color={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.muted }]}>{product.rating}</Text>
          </View>
        </View>
        {product.expressAvailable && (
          <View style={[styles.expressTag, { backgroundColor: colors.success + "18" }]}>
            <IconSymbol name="bolt.fill" size={10} color={colors.success} />
            <Text style={[styles.expressTagText, { color: colors.success }]}>Express</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function HorizontalProductRow({ title, products, showSeeAll }: { title: string; products: Product[]; showSeeAll?: boolean }) {
  const colors = useColors();
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {showSeeAll && (
          <TouchableOpacity onPress={() => router.push("/browse")} activeOpacity={0.6}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { deliveryMode } = useCart();

  const { availableStores, selectedStore, selectStore } = useStore();
  const { products: featuredApi } = useFeaturedProducts();
  const { products: expressApi } = useExpressProducts();
  const { products: premiumApi } = usePremiumProducts();
  const { products: allProducts } = useProducts();

  const featured = featuredApi;
  const express = expressApi.slice(0, 8);
  const premium = premiumApi;
  const deals = useMemo(
    () => allProducts.filter((p) => p.price < 30 && p.inStock).slice(0, 8),
    [allProducts]
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>Welcome to</Text>
            <Text style={[styles.appName, { color: colors.foreground }]}>LiquorDash</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/browse")}
            style={[styles.searchBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>Search spirits...</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Mode Toggle */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <DeliveryToggle />
        </View>

        {/* Hero Banner */}
        <TouchableOpacity
          style={[styles.heroBanner, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => router.push("/browse")}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>NEW</Text>
            <Text style={styles.heroTitle}>Premium Collection</Text>
            <Text style={styles.heroSubtitle}>
              Rare & exclusive spirits{"\n"}shipped nationwide
            </Text>
            <View style={styles.heroBtn}>
              <Text style={[styles.heroBtnText, { color: colors.primary }]}>Shop Now</Text>
            </View>
          </View>
          <View style={styles.heroImageWrap}>
            <Text style={styles.heroEmoji}>🥃</Text>
          </View>
        </TouchableOpacity>

        {/* Promo Banner */}
        <View style={[styles.promoBanner, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
          <IconSymbol name="shippingbox.fill" size={20} color={colors.success} />
          <Text style={[styles.promoText, { color: colors.success }]}>
            Free delivery on orders over $50
          </Text>
        </View>

        {/* Nearby Stores */}
        {deliveryMode === "express" && availableStores.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nearby Stores</Text>
            </View>
            <FlatList
              data={availableStores}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              renderItem={({ item: store }) => (
                <TouchableOpacity
                  onPress={() => selectStore(store.id)}
                  style={[
                    styles.storeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selectedStore?.id === store.id ? colors.primary : colors.border,
                      borderWidth: selectedStore?.id === store.id ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.storeAvatar, { backgroundColor: colors.primary + "15" }]}>
                    <IconSymbol name="storefront.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.storeCardName, { color: colors.foreground }]} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <View style={styles.storeCardMeta}>
                    <IconSymbol name="star.fill" size={10} color={colors.warning} />
                    <Text style={[styles.storeCardRating, { color: colors.muted }]}>
                      {store.averageRating?.toFixed(1) || "New"}
                    </Text>
                    <Text style={[styles.storeCardDist, { color: colors.muted }]}>
                      {store.expressDeliveryRadius} mi
                    </Text>
                  </View>
                  {selectedStore?.id === store.id && (
                    <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                      <IconSymbol name="checkmark.circle.fill" size={12} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Featured Products */}
        <HorizontalProductRow title="Featured Picks" products={featured} showSeeAll />

        {/* Express Delivery */}
        {deliveryMode === "express" && (
          <HorizontalProductRow title="Express Delivery" products={express} showSeeAll />
        )}

        {/* Premium Shipped */}
        {deliveryMode === "shipping" && (
          <HorizontalProductRow title="Premium Shipped" products={premium} showSeeAll />
        )}

        {/* Under $30 */}
        <HorizontalProductRow title="Under $30" products={deals} showSeeAll />

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
  },
  heroContent: {
    flex: 1,
    gap: 6,
  },
  heroTag: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
  heroBtn: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 6,
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  heroImageWrap: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  heroEmoji: {
    fontSize: 56,
  },
  promoBanner: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  promoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  productCard: {
    width: 160,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  productImageWrap: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: 10,
    gap: 2,
  },
  productBrand: {
    fontSize: 11,
    fontWeight: "500",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "500",
  },
  expressTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  expressTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  storeCard: {
    width: 130,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  storeCardName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  storeCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeCardRating: {
    fontSize: 11,
  },
  storeCardDist: {
    fontSize: 11,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
});
