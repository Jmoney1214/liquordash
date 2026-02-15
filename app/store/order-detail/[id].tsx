import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";
import { formatCurrency } from "@/lib/store-data";

export default function StoreOrderDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStoreOrder, updateOrderStatus } = useStore();

  const order = getStoreOrder(id ?? "");

  if (!order) {
    return (
      <ScreenContainer className="p-6">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 16 }}>Order not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const statusSteps = [
    { key: "pending", label: "Received", time: order.createdAt },
    { key: "accepted", label: "Accepted", time: order.acceptedAt },
    { key: "preparing", label: "Preparing", time: order.acceptedAt },
    { key: "ready", label: order.deliveryMode === "shipping" ? "Shipped" : "Ready", time: order.preparedAt },
    { key: "completed", label: "Completed", time: order.completedAt },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  const handleAccept = () => updateOrderStatus(order.id, "accepted");
  const handleReject = () => {
    Alert.alert("Reject Order", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => { updateOrderStatus(order.id, "rejected"); router.back(); } },
    ]);
  };
  const handlePreparing = () => updateOrderStatus(order.id, "preparing");
  const handleReady = () => updateOrderStatus(order.id, order.deliveryMode === "shipping" ? "shipped" : "ready");
  const handleComplete = () => updateOrderStatus(order.id, "completed");

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Order ID & Status */}
        <View style={styles.section}>
          <View style={styles.orderIdRow}>
            <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.orderId}</Text>
            {order.isGiftOrder && (
              <View style={[styles.giftBadge, { backgroundColor: "#FCE4EC" }]}>
                <IconSymbol name="gift.fill" size={12} color="#C62828" />
                <Text style={{ fontSize: 10, color: "#C62828", fontWeight: "600" }}>Gift Order</Text>
              </View>
            )}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Timeline</Text>
          <View style={styles.timeline}>
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={styles.timelineDotCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: isCompleted ? colors.primary : colors.border,
                          borderColor: isCurrent ? colors.primary : "transparent",
                          borderWidth: isCurrent ? 3 : 0,
                        },
                      ]}
                    >
                      {isCompleted && !isCurrent && (
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
                      )}
                    </View>
                    {i < statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: i < currentStepIndex ? colors.primary : colors.border },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: isCompleted ? colors.foreground : colors.muted },
                      ]}
                    >
                      {step.label}
                    </Text>
                    {step.time && isCompleted && (
                      <Text style={[styles.timelineTime, { color: colors.muted }]}>
                        {new Date(step.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <IconSymbol name="person.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>{order.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol name="location.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>{order.customerAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol
                name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"}
                size={16}
                color={order.deliveryMode === "express" ? colors.success : colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {order.deliveryMode === "express" ? "Express Delivery" : "Nationwide Shipping"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Items ({order.items.length})
          </Text>
          <View style={[styles.itemsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {order.items.map((item, i) => (
              <View key={i}>
                {i > 0 && <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />}
                <View style={styles.itemRow}>
                  <Image source={item.productImage} style={styles.itemImage} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.productName}</Text>
                    <Text style={[styles.itemQty, { color: colors.muted }]}>
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: colors.foreground }]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Financials */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Financials</Text>
          <View style={[styles.financialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.finRow}>
              <Text style={[styles.finLabel, { color: colors.muted }]}>Order Subtotal</Text>
              <Text style={[styles.finValue, { color: colors.foreground }]}>
                {formatCurrency(order.subtotal)}
              </Text>
            </View>
            <View style={[styles.finDivider, { backgroundColor: colors.border }]} />
            <View style={styles.finRow}>
              <Text style={[styles.finLabel, { color: colors.muted }]}>Platform Commission (15%)</Text>
              <Text style={[styles.finValue, { color: colors.error }]}>
                -{formatCurrency(order.commission)}
              </Text>
            </View>
            <View style={[styles.finDivider, { backgroundColor: colors.border }]} />
            <View style={[styles.finRow, { paddingVertical: 16 }]}>
              <Text style={[styles.finLabelBold, { color: colors.foreground }]}>Your Payout</Text>
              <Text style={[styles.finValueBold, { color: colors.success }]}>
                {formatCurrency(order.storePayout)}
              </Text>
            </View>
          </View>
        </View>

        {order.specialInstructions && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Special Instructions</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.instructionsText, { color: colors.foreground }]}>
                {order.specialInstructions}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {order.status === "pending" && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleReject}
            style={[styles.rejectBtn, { borderColor: colors.error }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccept}
            style={[styles.acceptBtn, { backgroundColor: colors.success }]}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptBtnText}>Accept Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "accepted" && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handlePreparing}
            style={[styles.fullActionBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={styles.fullActionBtnText}>Start Preparing</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "preparing" && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleReady}
            style={[styles.fullActionBtn, { backgroundColor: colors.success }]}
            activeOpacity={0.7}
          >
            <Text style={styles.fullActionBtnText}>
              {order.deliveryMode === "shipping" ? "Mark as Shipped" : "Mark as Ready"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "ready" && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleComplete}
            style={[styles.fullActionBtn, { backgroundColor: "#6A1B9A" }]}
            activeOpacity={0.7}
          >
            <Text style={styles.fullActionBtnText}>Complete Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
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
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderId: {
    fontSize: 24,
    fontWeight: "800",
  },
  giftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeline: {
    gap: 0,
  },
  timelineStep: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDotCol: {
    alignItems: "center",
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  timelineTime: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  itemsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  itemDivider: {
    height: 0.5,
    marginHorizontal: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "700",
  },
  financialCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  finDivider: {
    height: 0.5,
    marginHorizontal: 16,
  },
  finLabel: {
    fontSize: 14,
  },
  finValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  finLabelBold: {
    fontSize: 15,
    fontWeight: "700",
  },
  finValueBold: {
    fontSize: 18,
    fontWeight: "800",
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 0.5,
  },
  rejectBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  fullActionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  fullActionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
