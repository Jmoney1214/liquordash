import { useState, useMemo } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";
import { formatCurrency, StoreOrder, StoreOrderStatus } from "@/lib/store-data";

type Tab = "pending" | "active" | "completed";

function OrderActionCard({ order }: { order: StoreOrder }) {
  const colors = useColors();
  const router = useRouter();
  const { updateOrderStatus } = useStore();

  const handleAccept = () => {
    updateOrderStatus(order.id, "accepted");
  };

  const handleReject = () => {
    Alert.alert("Reject Order", "Are you sure you want to reject this order?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => updateOrderStatus(order.id, "rejected") },
    ]);
  };

  const handleMarkPreparing = () => {
    updateOrderStatus(order.id, "preparing");
  };

  const handleMarkReady = () => {
    if (order.deliveryMode === "shipping") {
      updateOrderStatus(order.id, "shipped");
    } else {
      updateOrderStatus(order.id, "ready");
    }
  };

  const handleComplete = () => {
    updateOrderStatus(order.id, "completed");
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "#FFF3E0", text: "#E65100", label: "New Order" },
    accepted: { bg: "#E3F2FD", text: "#1565C0", label: "Accepted" },
    preparing: { bg: "#FFF8E1", text: "#F57F17", label: "Preparing" },
    ready: { bg: "#E8F5E9", text: "#2E7D32", label: "Ready for Pickup" },
    shipped: { bg: "#E0F2F1", text: "#00695C", label: "Shipped" },
    completed: { bg: "#F3E5F5", text: "#6A1B9A", label: "Completed" },
    rejected: { bg: "#FFEBEE", text: "#C62828", label: "Rejected" },
    cancelled: { bg: "#ECEFF1", text: "#546E7A", label: "Cancelled" },
  };

  const sc = statusColors[order.status] || statusColors.pending;
  const timeSince = getTimeSince(order.createdAt);

  return (
    <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <View>
          <View style={styles.orderIdRow}>
            <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.orderId}</Text>
            {order.isGiftOrder && (
              <View style={[styles.giftBadge, { backgroundColor: "#FCE4EC" }]}>
                <IconSymbol name="gift.fill" size={10} color="#C62828" />
                <Text style={{ fontSize: 9, color: "#C62828", fontWeight: "600" }}>Gift</Text>
              </View>
            )}
          </View>
          <Text style={[styles.orderCustomer, { color: colors.muted }]}>{order.customerName}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
          </View>
          <Text style={[styles.orderTime, { color: colors.muted }]}>{timeSince}</Text>
        </View>
      </View>

      {/* Delivery Mode */}
      <View style={[styles.deliveryRow, { backgroundColor: colors.background }]}>
        <IconSymbol
          name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"}
          size={14}
          color={order.deliveryMode === "express" ? colors.success : colors.primary}
        />
        <Text style={[styles.deliveryText, { color: colors.foreground }]}>
          {order.deliveryMode === "express" ? "Express Delivery" : "Nationwide Shipping"}
        </Text>
        {order.deliveryMode === "express" && (
          <Text style={[styles.prepTime, { color: colors.muted }]}>
            ~{order.estimatedPrepTime} min prep
          </Text>
        )}
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Image source={item.productImage} style={styles.itemImage} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={[styles.itemQty, { color: colors.muted }]}>
                Qty: {item.quantity} × {formatCurrency(item.price)}
              </Text>
            </View>
            <Text style={[styles.itemTotal, { color: colors.foreground }]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
      </View>

      {/* Address */}
      <View style={[styles.addressRow, { borderTopColor: colors.border }]}>
        <IconSymbol name="location.fill" size={14} color={colors.muted} />
        <Text style={[styles.addressText, { color: colors.muted }]} numberOfLines={2}>
          {order.customerAddress}
        </Text>
      </View>

      {/* Totals */}
      <View style={[styles.totalsRow, { borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Order Total</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>
            {formatCurrency(order.subtotal)}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Commission</Text>
          <Text style={[styles.totalValue, { color: colors.error }]}>
            -{formatCurrency(order.commission)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Your Payout</Text>
          <Text style={[styles.totalValue, { color: colors.success }]}>
            {formatCurrency(order.storePayout)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {order.status === "pending" && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleReject}
            style={[styles.rejectBtn, { borderColor: colors.error }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} />
            <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccept}
            style={[styles.acceptBtn, { backgroundColor: colors.success }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "accepted" && (
        <TouchableOpacity
          onPress={handleMarkPreparing}
          style={[styles.fullBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <Text style={styles.fullBtnText}>Start Preparing</Text>
        </TouchableOpacity>
      )}

      {order.status === "preparing" && (
        <TouchableOpacity
          onPress={handleMarkReady}
          style={[styles.fullBtn, { backgroundColor: colors.success }]}
          activeOpacity={0.7}
        >
          <Text style={styles.fullBtnText}>
            {order.deliveryMode === "shipping" ? "Mark as Shipped" : "Mark as Ready"}
          </Text>
        </TouchableOpacity>
      )}

      {order.status === "ready" && (
        <TouchableOpacity
          onPress={handleComplete}
          style={[styles.fullBtn, { backgroundColor: "#6A1B9A" }]}
          activeOpacity={0.7}
        >
          <Text style={styles.fullBtnText}>Complete Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function StoreOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { pendingOrders, activeOrders, completedOrders, storeOrders } = useStore();
  const [tab, setTab] = useState<Tab>("pending");

  const displayOrders = useMemo(() => {
    switch (tab) {
      case "pending":
        return pendingOrders;
      case "active":
        return activeOrders;
      case "completed":
        return [...completedOrders, ...storeOrders.filter((o) => ["rejected", "cancelled"].includes(o.status))];
      default:
        return [];
    }
  }, [tab, pendingOrders, activeOrders, completedOrders, storeOrders]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Order Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["pending", "active", "completed"] as Tab[]).map((t) => {
          const count =
            t === "pending" ? pendingOrders.length : t === "active" ? activeOrders.length : completedOrders.length;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === t ? colors.primary : colors.muted },
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    { backgroundColor: t === "pending" ? "#E65100" : colors.primary },
                  ]}
                >
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {displayOrders.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="bag.fill" size={36} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No {tab} orders</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {tab === "pending"
                ? "New orders will appear here when customers place them."
                : tab === "active"
                ? "Orders you've accepted will appear here."
                : "Completed orders will show up here."}
            </Text>
          </View>
        ) : (
          displayOrders.map((order) => <OrderActionCard key={order.id} order={order} />)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
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
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
  },
  giftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderCustomer: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  orderTime: {
    fontSize: 11,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  prepTime: {
    fontSize: 11,
    marginLeft: "auto",
  },
  itemsList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 11,
    marginTop: 1,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 0.5,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  totalLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  fullBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
  },
  fullBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
