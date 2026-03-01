import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/favorites-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getProductById, formatPrice } from "@/lib/data";
import { useProductById } from "@/hooks/use-api";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { product } = useProductById(id);
  const [quantity, setQuantity] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  if (!product) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center p-6">
        <Text style={[styles.errorText, { color: colors.foreground }]}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnAlt, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const fav = isFavorite(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity, isGift ? { isGift, giftMessage } : undefined);
    Alert.alert("Added to Cart", `${product.name} x${quantity} added to your cart.`, [
      { text: "Continue Shopping", onPress: () => router.back() },
      { text: "View Cart", onPress: () => router.push("/(tabs)/cart" as any) },
    ]);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Nav */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.navBtn, { backgroundColor: colors.background + "E6" }]}
            activeOpacity={0.6}
          >
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleFavorite(product.id)}
            style={[styles.navBtn, { backgroundColor: colors.background + "E6" }]}
            activeOpacity={0.6}
          >
            <IconSymbol name={fav ? "heart.fill" : "heart"} size={22} color={fav ? colors.error : colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={product.imageUrl} style={styles.productImage} contentFit="cover" transition={300} />
          {product.premium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.brand, { color: colors.primary }]}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingWrap}>
              <IconSymbol name="star.fill" size={16} color={colors.warning} />
              <Text style={[styles.rating, { color: colors.foreground }]}>{product.rating}</Text>
              <Text style={[styles.reviewCount, { color: colors.muted }]}>({product.reviewCount} reviews)</Text>
            </View>
            <Text style={[styles.volume, { color: colors.muted }]}>{product.volume} · {product.abv}</Text>
          </View>

          <Text style={[styles.price, { color: colors.foreground }]}>{formatPrice(product.price)}</Text>

          {/* Delivery Options */}
          <View style={styles.deliveryOptions}>
            {product.expressAvailable && (
              <View style={[styles.deliveryTag, { backgroundColor: colors.success + "12", borderColor: colors.success + "30" }]}>
                <IconSymbol name="bolt.fill" size={14} color={colors.success} />
                <View>
                  <Text style={[styles.deliveryTagTitle, { color: colors.success }]}>Express Delivery</Text>
                  <Text style={[styles.deliveryTagSub, { color: colors.muted }]}>Under 60 min</Text>
                </View>
              </View>
            )}
            {product.shippingAvailable && (
              <View style={[styles.deliveryTag, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <IconSymbol name="shippingbox.fill" size={14} color={colors.primary} />
                <View>
                  <Text style={[styles.deliveryTagTitle, { color: colors.primary }]}>Ship to You</Text>
                  <Text style={[styles.deliveryTagSub, { color: colors.muted }]}>{product.shippingDays}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.sectionBody, { color: colors.muted }]}>{product.description}</Text>
          </View>

          {/* Tasting Notes */}
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tasting Notes</Text>
            <Text style={[styles.sectionBody, { color: colors.muted }]}>{product.tastingNotes}</Text>
          </View>

          {/* Pairings */}
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pairs Well With</Text>
            <Text style={[styles.sectionBody, { color: colors.muted }]}>{product.pairings}</Text>
          </View>

          {/* Gift Option */}
          <TouchableOpacity
            onPress={() => setIsGift(!isGift)}
            style={[styles.giftToggle, { backgroundColor: isGift ? colors.primary + "12" : colors.surface, borderColor: isGift ? colors.primary + "40" : colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="gift.fill" size={20} color={isGift ? colors.primary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.giftTitle, { color: isGift ? colors.primary : colors.foreground }]}>Send as a Gift</Text>
              <Text style={[styles.giftSub, { color: colors.muted }]}>Add a personal message and gift wrap</Text>
            </View>
            <View style={[styles.giftCheck, { borderColor: isGift ? colors.primary : colors.border, backgroundColor: isGift ? colors.primary : "transparent" }]}>
              {isGift && <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />}
            </View>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.6}
          >
            <IconSymbol name="minus" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: colors.foreground }]}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.6}
          >
            <IconSymbol name="plus" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="cart.fill" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add to Cart · {formatPrice(product.price * quantity)}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  premiumBadge: {
    position: "absolute",
    bottom: 12,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  brand: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 15,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 13,
  },
  volume: {
    fontSize: 13,
    fontWeight: "500",
  },
  price: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
  },
  deliveryOptions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  deliveryTag: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deliveryTagTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  deliveryTagSub: {
    fontSize: 11,
    marginTop: 1,
  },
  section: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  giftToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  giftTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  giftSub: {
    fontSize: 12,
    marginTop: 1,
  },
  giftCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  qtyText: {
    fontSize: 17,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  backBtnAlt: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnAltText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
