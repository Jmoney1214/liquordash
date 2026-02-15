import { useState, useMemo } from "react";
import { Text, View, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOrders } from "@/lib/orders-store";
import { useCart } from "@/lib/cart-store";
import { Order, formatPrice, OrderStatus } from "@/lib/data";

const FILTERS = ["All", "Active", "Delivered", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_CONFIG: Record<OrderStatus, { label: string; colorKey: "success" | "warning" | "error" | "primary" | "muted" }> = {
  confirmed: { label: "Confirmed", colorKey: "primary" },
  preparing: { label: "Preparing", colorKey: "warning" },
  "out-for-delivery": { label: "Out for Delivery", colorKey: "primary" },
  shipped: { label: "Shipped", colorKey: "primary" },
  "in-transit": { label: "In Transit", colorKey: "primary" },
  delivered: { label: "Delivered", colorKey: "success" },
  cancelled: { label: "Cancelled", colorKey: "error" },
};

function OrderCard({ order, onReorder, onViewDetail }: { order: Order; onReorder: () => void; onViewDetail: () => void }) {
  const colors = useColors();
  const statusConf = STATUS_CONFIG[order.status];
  const statusColor = colors[statusConf.colorKey];
  const date = new Date(order.createdAt);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <TouchableOpacity onPress={onViewDetail} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}>
      <View style={styles.orderTop}>
        <View>
          <Text style={[styles.orderId, { color: colors.foreground }]}>{order.id}</Text>
          <Text style={[styles.orderDate, { color: colors.muted }]}>
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusConf.label}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 3).map((item, idx) => (
          <Text key={idx} style={[styles.orderItemText, { color: colors.muted }]} numberOfLines={1}>
            {item.quantity}x {item.product.name}
          </Text>
        ))}
        {order.items.length > 3 && (
          <Text style={[styles.moreItems, { color: colors.muted }]}>+{order.items.length - 3} more items</Text>
        )}
      </View>

      <View style={styles.orderBottom}>
        <View style={styles.orderMeta}>
          <View style={[styles.modeBadge, { backgroundColor: colors.primary + "12" }]}>
            <IconSymbol name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"} size={12} color={colors.primary} />
            <Text style={[styles.modeText, { color: colors.primary }]}>
              {order.deliveryMode === "express" ? "Express" : "Shipped"}
            </Text>
          </View>
          <Text style={[styles.orderItemCount, { color: colors.muted }]}>{itemCount} item{itemCount !== 1 ? "s" : ""}</Text>
        </View>
        <View style={styles.orderRight}>
          <Text style={[styles.orderTotal, { color: colors.foreground }]}>{formatPrice(order.total)}</Text>
          {(order.status === "delivered" || order.status === "cancelled") && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onReorder(); }}
              style={[styles.reorderBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.triangle.2.circlepath" size={14} color="#fff" />
              <Text style={styles.reorderText}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { orders } = useOrders();
  const { addItem, setDeliveryMode } = useCart();
  const [filter, setFilter] = useState<Filter>("All");

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case "Active":
        return orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
      case "Delivered":
        return orders.filter((o) => o.status === "delivered");
      case "Cancelled":
        return orders.filter((o) => o.status === "cancelled");
      default:
        return orders;
    }
  }, [orders, filter]);

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem(item.product, item.quantity);
    });
    setDeliveryMode(order.deliveryMode);
    router.push("/(tabs)/cart");
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterTab, { backgroundColor: filter === f ? colors.primary : colors.surface, borderColor: filter === f ? colors.primary : colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.muted }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{orders.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {formatPrice(orders.reduce((sum, o) => sum + o.total, 0))}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Spent</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {orders.filter((o) => o.status === "delivered").length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Delivered</Text>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onReorder={() => handleReorder(item)}
            onViewDetail={() => router.push(`/order/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="bag.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Orders</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {filter === "All" ? "Place your first order to see it here" : `No ${filter.toLowerCase()} orders`}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  orderId: { fontSize: 15, fontWeight: "700" },
  orderDate: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  orderItems: { gap: 2, marginBottom: 10 },
  orderItemText: { fontSize: 13 },
  moreItems: { fontSize: 12, fontStyle: "italic", marginTop: 2 },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modeText: { fontSize: 11, fontWeight: "600" },
  orderItemCount: { fontSize: 12 },
  orderRight: { alignItems: "flex-end", gap: 6 },
  orderTotal: { fontSize: 16, fontWeight: "700" },
  reorderBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  reorderText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
});
