import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  useAdmin,
  PlatformOrder,
  PlatformOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  formatAdminCurrency,
  getTimeAgoAdmin,
} from "@/lib/admin-store";

type FilterTab = "all" | "active" | "delivered" | "cancelled";

function OrderCard({ order }: { order: PlatformOrder }) {
  const colors = useColors();
  const statusColor = ORDER_STATUS_COLORS[order.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.orderIdRow}>
              <Text style={[styles.orderId, { color: colors.foreground }]}>{order.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{ORDER_STATUS_LABELS[order.status]}</Text>
              </View>
            </View>
            <Text style={[styles.orderTime, { color: colors.muted }]}>{getTimeAgoAdmin(order.createdAt)}</Text>
          </View>
          <Text style={[styles.orderTotal, { color: colors.foreground }]}>{formatAdminCurrency(order.total)}</Text>
        </View>

        <View style={styles.orderMeta}>
          <View style={styles.metaRow}>
            <IconSymbol name="person.fill" size={13} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>{order.customerName}</Text>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol name="storefront.fill" size={13} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>{order.storeName}</Text>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"} size={13} color={order.deliveryMode === "express" ? "#0EA5E9" : "#8B5CF6"} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {order.deliveryMode === "express" ? "Express" : "Shipping"} · {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
            </Text>
          </View>
          {order.driverName && (
            <View style={styles.metaRow}>
              <IconSymbol name="car.fill" size={13} color={colors.muted} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{order.driverName}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandedSection, { borderColor: colors.border }]}>
          <View style={styles.expandedRow}>
            <Text style={[styles.expandedLabel, { color: colors.muted }]}>Subtotal</Text>
            <Text style={[styles.expandedValue, { color: colors.foreground }]}>{formatAdminCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={[styles.expandedLabel, { color: colors.muted }]}>Delivery Fee</Text>
            <Text style={[styles.expandedValue, { color: colors.foreground }]}>{formatAdminCurrency(order.deliveryFee)}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={[styles.expandedLabel, { color: colors.muted }]}>Platform Fee</Text>
            <Text style={[styles.expandedValue, { color: colors.foreground }]}>{formatAdminCurrency(order.platformFee)}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={[styles.expandedLabel, { color: "#22C55E" }]}>Commission</Text>
            <Text style={[styles.expandedValue, { color: "#22C55E" }]}>{formatAdminCurrency(order.commission)}</Text>
          </View>
          <View style={styles.expandedRow}>
            <IconSymbol name="location.fill" size={13} color={colors.muted} />
            <Text style={[styles.expandedAddress, { color: colors.muted }]}>{order.deliveryAddress}</Text>
          </View>
          {order.isGift && (
            <View style={[styles.giftBadge, { backgroundColor: "#F59E0B" + "15" }]}>
              <IconSymbol name="gift.fill" size={14} color="#F59E0B" />
              <Text style={[styles.giftText, { color: "#F59E0B" }]}>Gift Order</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function AdminOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { platformOrders } = useAdmin();
  const [filter, setFilter] = useState<FilterTab>("all");

  const filteredOrders = platformOrders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return !["delivered", "cancelled", "refunded"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    return o.status === "cancelled" || o.status === "refunded";
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const counts = {
    all: platformOrders.length,
    active: platformOrders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length,
    delivered: platformOrders.filter((o) => o.status === "delivered").length,
    cancelled: platformOrders.filter((o) => o.status === "cancelled" || o.status === "refunded").length,
  };

  const totalRevenue = platformOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const totalCommission = platformOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.commission, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Order Monitor</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#22C55E" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{formatAdminCurrency(totalRevenue)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Revenue</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#F59E0B" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>{formatAdminCurrency(totalCommission)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Commission</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#3B82F6" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#3B82F6" }]}>{counts.active}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Active</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["all", "active", "delivered", "cancelled"] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.filterTab, filter === tab && { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, { color: filter === tab ? "#fff" : colors.muted }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="bag.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No orders found</Text>
          </View>
        ) : (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  filterTabText: { fontSize: 12, fontWeight: "600" },
  // Order Card
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderIdRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderId: { fontSize: 14, fontWeight: "700" },
  orderTime: { fontSize: 11, marginTop: 2 },
  orderTotal: { fontSize: 16, fontWeight: "800" },
  orderMeta: { marginTop: 10, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  // Status
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  // Expanded
  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  expandedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  expandedLabel: { fontSize: 12 },
  expandedValue: { fontSize: 12, fontWeight: "600" },
  expandedAddress: { fontSize: 11, flex: 1, marginLeft: 4 },
  giftBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start", marginTop: 4 },
  giftText: { fontSize: 11, fontWeight: "600" },
  // Empty
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600" },
});
