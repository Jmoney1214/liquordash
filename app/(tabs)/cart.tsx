import { FlatList, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPrice, CartItem } from "@/lib/data";

function CartItemRow({ item }: { item: CartItem }) {
  const colors = useColors();
  const { updateQuantity, removeItem } = useCart();

  return (
    <View style={[styles.cartItem, { borderColor: colors.border }]}>
      <Image source={item.product.imageUrl} style={styles.cartImage} contentFit="cover" transition={200} />
      <View style={styles.cartInfo}>
        <Text style={[styles.cartBrand, { color: colors.muted }]}>{item.product.brand}</Text>
        <Text style={[styles.cartName, { color: colors.foreground }]} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={[styles.cartVolume, { color: colors.muted }]}>{item.product.volume}</Text>
        {item.isGift && (
          <View style={[styles.giftTag, { backgroundColor: colors.primary + "18" }]}>
            <IconSymbol name="gift.fill" size={10} color={colors.primary} />
            <Text style={[styles.giftTagText, { color: colors.primary }]}>Gift</Text>
          </View>
        )}
        <View style={styles.cartActions}>
          <Text style={[styles.cartPrice, { color: colors.foreground }]}>
            {formatPrice(item.product.price * item.quantity)}
          </Text>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.6}
            >
              <IconSymbol name="minus" size={16} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.6}
            >
              <IconSymbol name="plus" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.product.id)} style={styles.removeBtn} activeOpacity={0.6}>
        <IconSymbol name="trash.fill" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const { items, subtotal, deliveryFee, serviceFee, tax, total, deliveryMode, expressItems, shippingItems } = useCart();

  if (items.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Browse our collection and add your favorite spirits
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/browse" as any)}
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={styles.browseBtnText}>Browse Spirits</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const hasExpressAndShipping = expressItems.length > 0 && shippingItems.some((s) => !s.product.expressAvailable);

  return (
    <ScreenContainer>
      <View style={styles.cartHeader}>
        <Text style={[styles.cartTitle, { color: colors.foreground }]}>Cart</Text>
        <Text style={[styles.cartCount, { color: colors.muted }]}>{items.length} items</Text>
      </View>

      {hasExpressAndShipping && (
        <View style={[styles.mixedNotice, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "30" }]}>
          <IconSymbol name="info.circle.fill" size={16} color={colors.warning} />
          <Text style={[styles.mixedText, { color: colors.warning }]}>
            Your cart has both express and shipping items. They will be processed as separate orders.
          </Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => <CartItemRow item={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Order Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            {deliveryMode === "express" ? "Delivery Fee" : "Shipping Fee"}
          </Text>
          <Text style={[styles.summaryValue, { color: deliveryFee === 0 ? colors.success : colors.foreground }]}>
            {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Service Fee</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(serviceFee)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Tax</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(tax)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/checkout" as any)}
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  cartTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  cartCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  mixedNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  mixedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  cartItem: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  cartInfo: {
    flex: 1,
  },
  cartBrand: {
    fontSize: 11,
    fontWeight: "500",
  },
  cartName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  cartVolume: {
    fontSize: 11,
    marginTop: 2,
  },
  giftTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  giftTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cartActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cartPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: {
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  summaryContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  checkoutBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  browseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  browseBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
