import { Text, View, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart-store";
import { useOrders } from "@/lib/orders-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPrice } from "@/lib/data";
import { trpc } from "@/lib/trpc";
// Notifications are native-only; conditionally require to avoid web bundling issues
const sendLocalNotification = Platform.OS !== "web"
  ? require("@/lib/notifications").sendLocalNotification
  : async () => {};
const NOTIFICATION_CHANNELS = Platform.OS !== "web"
  ? require("@/lib/notifications").NOTIFICATION_CHANNELS
  : { ORDERS: "orders" };

// Default store pickup address (would come from store settings in production)
const STORE_PICKUP = {
  address: "123 Liquor Store Ave, New York, NY 10001",
  name: "LiquorDash Store",
  phone: "+12125551234",
};

interface UberQuote {
  quoteId: string;
  fee: number; // cents
  currency: string;
  dropoffEta: string;
  duration: number; // minutes
  pickupDuration: number;
  expires: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { items, deliveryMode, setDeliveryMode, subtotal, deliveryFee, serviceFee, tax, total, clearCart } = useCart();
  const { placeOrder, updateUberDelivery } = useOrders();

  const [address, setAddress] = useState("123 Main Street, Apt 4B");
  const [city, setCity] = useState("New York");
  const [state, setState] = useState("NY");
  const [zip, setZip] = useState("10001");
  const [phone, setPhone] = useState("+12125559876");
  const [recipientName, setRecipientName] = useState("");
  const [cardLast4] = useState("4242");
  const [tipPercent, setTipPercent] = useState(15);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Uber Direct quote state
  const [uberQuote, setUberQuote] = useState<UberQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const quoteMutation = trpc.delivery.quote.useMutation();
  const createDeliveryMutation = trpc.delivery.create.useMutation();

  const tipAmount = deliveryMode === "express" ? Math.round(subtotal * (tipPercent / 100) * 100) / 100 : 0;

  // Use Uber fee when available for express, otherwise fall back to static fee
  const effectiveDeliveryFee = deliveryMode === "express" && uberQuote
    ? uberQuote.fee / 100 // convert cents to dollars
    : deliveryFee;

  const adjustedTotal = Math.round((subtotal + effectiveDeliveryFee + serviceFee + tax + tipAmount) * 100) / 100;

  // Fetch Uber delivery quote when express is selected and address is filled
  const fetchUberQuote = useCallback(async () => {
    if (deliveryMode !== "express") return;
    const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim();
    if (!address.trim() || !city.trim() || !state.trim() || !zip.trim()) return;

    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const result = await quoteMutation.mutateAsync({
        pickupAddress: STORE_PICKUP.address,
        pickupName: STORE_PICKUP.name,
        pickupPhone: STORE_PICKUP.phone,
        dropoffAddress: fullAddress,
        dropoffName: recipientName || "Customer",
        dropoffPhone: phone,
        items: items.map((item) => ({
          name: `${item.product.brand} ${item.product.name}`,
          quantity: item.quantity,
          price: Math.round(item.product.price * 100), // cents
          size: "medium" as const,
        })),
      });
      setUberQuote(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get delivery quote";
      setQuoteError(msg);
      setUberQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [deliveryMode, address, city, state, zip, phone, recipientName, items]);

  // Auto-fetch quote when express mode is selected
  useEffect(() => {
    if (deliveryMode === "express" && address.trim() && city.trim() && state.trim() && zip.trim()) {
      const timer = setTimeout(fetchUberQuote, 800); // debounce
      return () => clearTimeout(timer);
    } else {
      setUberQuote(null);
      setQuoteError(null);
    }
  }, [deliveryMode, address, city, state, zip]);

  const handlePlaceOrder = async () => {
    if (!address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      Alert.alert("Missing Address", "Please fill in all address fields.");
      return;
    }

    setPlacingOrder(true);
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;

    try {
      const order = placeOrder({
        items,
        deliveryMode,
        subtotal,
        deliveryFee: effectiveDeliveryFee,
        serviceFee,
        tax: tax + tipAmount,
        total: adjustedTotal,
        deliveryAddress: fullAddress,
        uberQuoteId: uberQuote?.quoteId,
        uberFee: uberQuote?.fee,
      });

      // If express delivery with Uber quote, dispatch an Uber courier
      if (deliveryMode === "express" && uberQuote) {
        try {
          const delivery = await createDeliveryMutation.mutateAsync({
            pickupAddress: STORE_PICKUP.address,
            pickupName: STORE_PICKUP.name,
            pickupPhone: STORE_PICKUP.phone,
            pickupNotes: "Liquor order — check ID on pickup",
            dropoffAddress: fullAddress,
            dropoffName: recipientName || "Customer",
            dropoffPhone: phone,
            dropoffNotes: specialInstructions || undefined,
            items: items.map((item) => ({
              name: `${item.product.brand} ${item.product.name}`,
              quantity: item.quantity,
              price: Math.round(item.product.price * 100),
              size: "medium" as const,
            })),
            manifestDescription: `LiquorDash Order ${order.id}`,
            manifestTotalValue: Math.round(subtotal * 100),
            quoteId: uberQuote.quoteId,
            externalId: order.id,
          });

          // Update the order with Uber delivery details
          updateUberDelivery(order.id, {
            uberDeliveryId: delivery.deliveryId,
            uberTrackingUrl: delivery.trackingUrl,
            uberStatus: delivery.status,
            uberCourier: delivery.courier,
            uberPickupEta: delivery.pickupEta,
            uberDropoffEta: delivery.dropoffEta,
          });
        } catch (uberErr) {
          // Order is placed locally even if Uber dispatch fails
          console.warn("Uber dispatch failed:", uberErr);
        }
      }

      clearCart();

      // Send push notification
      sendLocalNotification({
        title: "Order Confirmed!",
        body: deliveryMode === "express"
          ? `Order ${order.id.slice(0, 8)} placed. ${uberQuote ? `Uber courier arriving in ~${uberQuote.duration} min.` : "Estimated delivery in under 60 minutes."}`
          : `Order ${order.id.slice(0, 8)} placed. Tracking: ${order.trackingNumber}`,
        data: { type: "order_confirmed", orderId: order.id, url: `/order/${order.id}` },
        channelId: NOTIFICATION_CHANNELS.ORDERS,
      });

      Alert.alert(
        "Order Placed!",
        deliveryMode === "express" && uberQuote
          ? `Your order ${order.id} has been confirmed. An Uber courier will deliver in ~${uberQuote.duration} minutes.`
          : `Your order ${order.id} has been confirmed.${deliveryMode === "express" ? " Estimated delivery in under 60 minutes." : ` Tracking number: ${order.trackingNumber}`}`,
        [{ text: "View Order", onPress: () => router.replace(`/order/${order.id}` as any) }]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center p-6">
        <Text style={[styles.emptyText, { color: colors.foreground }]}>Your cart is empty</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnAlt, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Delivery Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Method</Text>
          <View style={styles.deliveryOptions}>
            <TouchableOpacity
              onPress={() => setDeliveryMode("express")}
              style={[
                styles.deliveryOption,
                {
                  backgroundColor: deliveryMode === "express" ? colors.primary + "10" : colors.surface,
                  borderColor: deliveryMode === "express" ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <IconSymbol name="bolt.fill" size={24} color={deliveryMode === "express" ? colors.primary : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deliveryTitle, { color: deliveryMode === "express" ? colors.primary : colors.foreground }]}>
                  Express via Uber
                </Text>
                <Text style={[styles.deliverySub, { color: colors.muted }]}>
                  {uberQuote ? `~${uberQuote.duration} min` : "Under 60 minutes"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {quoteLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : uberQuote ? (
                  <Text style={[styles.deliveryPrice, { color: deliveryMode === "express" ? colors.primary : colors.foreground }]}>
                    {formatPrice(uberQuote.fee / 100)}
                  </Text>
                ) : (
                  <Text style={[styles.deliveryPrice, { color: deliveryMode === "express" ? colors.primary : colors.foreground }]}>
                    {subtotal >= 50 ? "FREE" : "$5.99"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeliveryMode("shipping")}
              style={[
                styles.deliveryOption,
                {
                  backgroundColor: deliveryMode === "shipping" ? colors.primary + "10" : colors.surface,
                  borderColor: deliveryMode === "shipping" ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <IconSymbol name="shippingbox.fill" size={24} color={deliveryMode === "shipping" ? colors.primary : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deliveryTitle, { color: deliveryMode === "shipping" ? colors.primary : colors.foreground }]}>
                  Ship to Me
                </Text>
                <Text style={[styles.deliverySub, { color: colors.muted }]}>2-5 business days</Text>
              </View>
              <Text style={[styles.deliveryPrice, { color: deliveryMode === "shipping" ? colors.primary : colors.foreground }]}>
                {subtotal >= 50 ? "FREE" : "$9.99"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Uber Quote Info Banner */}
        {deliveryMode === "express" && uberQuote && (
          <View style={[styles.uberBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.uberBannerRow}>
              <IconSymbol name="car.fill" size={18} color={colors.primary} />
              <Text style={[styles.uberBannerTitle, { color: colors.foreground }]}>Uber Direct Delivery</Text>
            </View>
            <View style={styles.uberBannerDetails}>
              <View style={styles.uberBannerItem}>
                <Text style={[styles.uberBannerLabel, { color: colors.muted }]}>Pickup</Text>
                <Text style={[styles.uberBannerValue, { color: colors.foreground }]}>~{uberQuote.pickupDuration} min</Text>
              </View>
              <View style={[styles.uberBannerDivider, { backgroundColor: colors.border }]} />
              <View style={styles.uberBannerItem}>
                <Text style={[styles.uberBannerLabel, { color: colors.muted }]}>Total ETA</Text>
                <Text style={[styles.uberBannerValue, { color: colors.foreground }]}>~{uberQuote.duration} min</Text>
              </View>
              <View style={[styles.uberBannerDivider, { backgroundColor: colors.border }]} />
              <View style={styles.uberBannerItem}>
                <Text style={[styles.uberBannerLabel, { color: colors.muted }]}>Fee</Text>
                <Text style={[styles.uberBannerValue, { color: colors.primary }]}>{formatPrice(uberQuote.fee / 100)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Uber Quote Error */}
        {deliveryMode === "express" && quoteError && (
          <View style={[styles.quoteErrorBanner, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteErrorText, { color: colors.error }]}>Could not get Uber quote</Text>
              <Text style={[styles.quoteErrorSub, { color: colors.muted }]}>Using standard delivery fee instead</Text>
            </View>
            <TouchableOpacity onPress={fetchUberQuote} activeOpacity={0.7}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {deliveryMode === "express" ? "Delivery Address" : "Shipping Address"}
          </Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Recipient Name"
              placeholderTextColor={colors.muted}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Street Address"
              placeholderTextColor={colors.muted}
              value={address}
              onChangeText={setAddress}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="City"
                placeholderTextColor={colors.muted}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, styles.inputSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="State"
                placeholderTextColor={colors.muted}
                value={state}
                onChangeText={setState}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, styles.inputMedium, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="ZIP"
                placeholderTextColor={colors.muted}
                value={zip}
                onChangeText={setZip}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="creditcard.fill" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.paymentTitle, { color: colors.foreground }]}>Visa ending in {cardLast4}</Text>
              <Text style={[styles.paymentSub, { color: colors.muted }]}>Default payment method</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Tip (Express only) */}
        {deliveryMode === "express" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Driver Tip</Text>
            <View style={styles.tipRow}>
              {[0, 10, 15, 20, 25].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  onPress={() => setTipPercent(pct)}
                  style={[
                    styles.tipChip,
                    {
                      backgroundColor: tipPercent === pct ? colors.primary : colors.surface,
                      borderColor: tipPercent === pct ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tipText, { color: tipPercent === pct ? "#fff" : colors.foreground }]}>
                    {pct === 0 ? "None" : `${pct}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {tipAmount > 0 && (
              <Text style={[styles.tipAmount, { color: colors.muted }]}>
                Tip amount: {formatPrice(tipAmount)}
              </Text>
            )}
          </View>
        )}

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Special Instructions</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Leave at door, ring bell, etc."
            placeholderTextColor={colors.muted}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        <View style={[styles.section, styles.summarySection]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              Subtotal ({items.length} items)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              {deliveryMode === "express" ? (uberQuote ? "Uber Delivery Fee" : "Delivery Fee") : "Shipping Fee"}
            </Text>
            {quoteLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.summaryValue, { color: effectiveDeliveryFee === 0 ? colors.success : colors.foreground }]}>
                {effectiveDeliveryFee === 0 ? "FREE" : formatPrice(effectiveDeliveryFee)}
              </Text>
            )}
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Service Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(serviceFee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Tax</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(tax)}</Text>
          </View>
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Driver Tip</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(tipAmount)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(adjustedTotal)}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placingOrder || quoteLoading}
          style={[
            styles.placeOrderBtn,
            { backgroundColor: colors.primary },
            (placingOrder || quoteLoading) && { opacity: 0.6 },
          ]}
          activeOpacity={0.7}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
          )}
          <Text style={styles.placeOrderText}>
            {placingOrder ? "Placing Order..." : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  deliveryOptions: {
    gap: 10,
  },
  deliveryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  deliverySub: {
    fontSize: 12,
    marginTop: 1,
  },
  deliveryPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  uberBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  uberBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  uberBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  uberBannerDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  uberBannerItem: {
    flex: 1,
    alignItems: "center",
  },
  uberBannerLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  uberBannerValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  uberBannerDivider: {
    width: 1,
    height: 28,
  },
  quoteErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  quoteErrorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  quoteErrorSub: {
    fontSize: 11,
    marginTop: 1,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputGroup: {
    gap: 10,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputFlex: {
    flex: 1,
  },
  inputSmall: {
    width: 60,
  },
  inputMedium: {
    width: 80,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  paymentSub: {
    fontSize: 12,
    marginTop: 1,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tipAmount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  summarySection: {
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
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
