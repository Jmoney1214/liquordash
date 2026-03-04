import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useOrders } from "@/lib/orders-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPrice, OrderStatus } from "@/lib/data";

function getStatusSteps(deliveryMode: string): { status: OrderStatus; label: string; icon: any }[] {
  if (deliveryMode === "express") {
    return [
      { status: "confirmed", label: "Order Confirmed", icon: "checkmark.circle.fill" },
      { status: "preparing", label: "Preparing", icon: "clock.fill" },
      { status: "out-for-delivery", label: "Out for Delivery", icon: "bolt.fill" },
      { status: "delivered", label: "Delivered", icon: "house.fill" },
    ];
  }
  return [
    { status: "confirmed", label: "Order Confirmed", icon: "checkmark.circle.fill" },
    { status: "preparing", label: "Processing", icon: "clock.fill" },
    { status: "shipped", label: "Shipped", icon: "shippingbox.fill" },
    { status: "in-transit", label: "In Transit", icon: "shippingbox.fill" },
    { status: "delivered", label: "Delivered", icon: "house.fill" },
  ];
}

function getStepIndex(status: OrderStatus, steps: { status: OrderStatus }[]): number {
  const idx = steps.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { getOrder } = useOrders();

  const order = getOrder(id);

  if (!order) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center p-6">
        <Text style={[styles.errorText, { color: colors.foreground }]}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnAlt, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const steps = getStatusSteps(order.deliveryMode);
  const currentStepIdx = getStepIndex(order.status, steps);
  const isCancelled = order.status === "cancelled";

  const createdDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const estimatedDate = new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Order ID & Status */}
        <View style={[styles.orderIdCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.orderId, { color: colors.foreground }]}>{order.id}</Text>
            <Text style={[styles.orderDate, { color: colors.muted }]}>{createdDate}</Text>
          </View>
          <View style={[styles.modeBadge, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol
              name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"}
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.modeText, { color: colors.primary }]}>
              {order.deliveryMode === "express" ? "Express" : "Shipped"}
            </Text>
          </View>
        </View>

        {/* Tracking Progress */}
        {!isCancelled && (
          <View style={styles.trackingSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Status</Text>
            <View style={styles.stepsContainer}>
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isLast = idx === steps.length - 1;

                return (
                  <View key={step.status} style={styles.stepRow}>
                    <View style={styles.stepIndicator}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: isCompleted ? colors.primary : colors.border,
                            borderColor: isCurrent ? colors.primary : "transparent",
                            borderWidth: isCurrent ? 3 : 0,
                          },
                        ]}
                      >
                        {isCompleted && (
                          <IconSymbol name={step.icon as any} size={14} color="#fff" />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.stepLine,
                            { backgroundColor: idx < currentStepIdx ? colors.primary : colors.border },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isCompleted ? colors.foreground : colors.muted,
                            fontWeight: isCurrent ? "700" : "500",
                          },
                        ]}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text style={[styles.stepSub, { color: colors.primary }]}>Current status</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.cancelledBanner, { backgroundColor: colors.error + "12", borderColor: colors.error + "30" }]}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
            <Text style={[styles.cancelledText, { color: colors.error }]}>This order has been cancelled</Text>
          </View>
        )}

        {/* Live Tracking Button for Express Orders */}
        {order.deliveryMode === "express" && !isCancelled && order.status !== "delivered" && (
          <TouchableOpacity
            onPress={() => router.push(`/tracking/${order.id}` as any)}
            style={[styles.trackLiveBtn, { backgroundColor: "#1B6B3A" }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="location.fill" size={18} color="#fff" />
            <Text style={styles.trackLiveBtnText}>Track Live</Text>
            <IconSymbol name="chevron.right" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Uber Courier Info */}
        {order.uberDeliveryId && (
          <View style={[styles.uberCourierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.uberCourierHeader}>
              <IconSymbol name="car.fill" size={18} color={colors.primary} />
              <Text style={[styles.uberCourierTitle, { color: colors.foreground }]}>Uber Direct Delivery</Text>
              <View style={[styles.uberStatusBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.uberStatusText, { color: colors.primary }]}>
                  {order.uberStatus || "pending"}
                </Text>
              </View>
            </View>
            {order.uberCourier?.name && (
              <View style={styles.uberCourierInfo}>
                <View style={[styles.uberCourierAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <IconSymbol name="person.fill" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uberCourierName, { color: colors.foreground }]}>
                    {order.uberCourier.name}
                  </Text>
                  {order.uberCourier.vehicleType && (
                    <Text style={[styles.uberCourierVehicle, { color: colors.muted }]}>
                      {order.uberCourier.vehicleType}
                    </Text>
                  )}
                </View>
                {order.uberCourier.phone && (
                  <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
                    <IconSymbol name="phone.fill" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {order.uberTrackingUrl && (
              <TouchableOpacity
                style={[styles.uberTrackBtn, { borderColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <IconSymbol name="location.north.line.fill" size={14} color={colors.primary} />
                <Text style={[styles.uberTrackBtnText, { color: colors.primary }]}>Open Uber Tracking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Estimated Delivery */}
        <View style={[styles.estimateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="clock.fill" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.estimateLabel, { color: colors.muted }]}>
              {order.status === "delivered" ? "Delivered" : "Estimated Delivery"}
            </Text>
            <Text style={[styles.estimateValue, { color: colors.foreground }]}>{estimatedDate}</Text>
          </View>
        </View>

        {/* Tracking Number */}
        {order.trackingNumber && (
          <View style={[styles.trackingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackingLabel, { color: colors.muted }]}>Tracking Number</Text>
              <Text style={[styles.trackingValue, { color: colors.foreground }]}>{order.trackingNumber}</Text>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {order.deliveryMode === "express" ? "Delivery Address" : "Shipping Address"}
          </Text>
          <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="location.fill" size={18} color={colors.primary} />
            <Text style={[styles.addressText, { color: colors.foreground }]}>{order.deliveryAddress}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Items ({order.items.length})
          </Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, { borderColor: colors.border }]}>
              <Image source={item.product.imageUrl} style={styles.itemImage} contentFit="cover" transition={200} />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.muted }]}>
                  {item.product.volume} · Qty: {item.quantity}
                </Text>
                {item.isGift && (
                  <View style={[styles.giftTag, { backgroundColor: colors.primary + "15" }]}>
                    <IconSymbol name="gift.fill" size={10} color={colors.primary} />
                    <Text style={[styles.giftText, { color: colors.primary }]}>Gift</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatPrice(item.product.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Total */}
        <View style={[styles.totalSection, { borderColor: colors.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Subtotal</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>
              {order.deliveryMode === "express" ? "Delivery Fee" : "Shipping Fee"}
            </Text>
            <Text style={[styles.totalValue, { color: order.deliveryFee === 0 ? colors.success : colors.foreground }]}>
              {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Service Fee</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(order.serviceFee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Tax</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(order.tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.grandTotalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.foreground }]}>{formatPrice(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
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
  orderIdCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "800",
  },
  orderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trackingSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  stepsContainer: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 52,
  },
  stepIndicator: {
    alignItems: "center",
    width: 30,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
  },
  stepSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: "600",
  },
  estimateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  estimateLabel: {
    fontSize: 12,
  },
  estimateValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  trackingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  trackingLabel: {
    fontSize: 12,
  },
  trackingValue: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  giftTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  giftText: {
    fontSize: 10,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalSection: {
    marginHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 13,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  grandTotalRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  grandTotalValue: {
    fontSize: 17,
    fontWeight: "800",
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
  trackLiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  trackLiveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  uberCourierCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  uberCourierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uberCourierTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  uberStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uberStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  uberCourierInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uberCourierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  uberCourierName: {
    fontSize: 15,
    fontWeight: "600",
  },
  uberCourierVehicle: {
    fontSize: 12,
    marginTop: 1,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uberTrackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  uberTrackBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
