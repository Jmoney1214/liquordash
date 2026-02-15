import { Text, View, ScrollView, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";
import { formatCurrency, StoreOrder } from "@/lib/store-data";

function MetricCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function OrderCard({ order, onPress }: { order: StoreOrder; onPress: () => void }) {
  const colors = useColors();

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "#FFF3E0", text: "#E65100", label: "New Order" },
    accepted: { bg: "#E3F2FD", text: "#1565C0", label: "Accepted" },
    preparing: { bg: "#FFF8E1", text: "#F57F17", label: "Preparing" },
    ready: { bg: "#E8F5E9", text: "#2E7D32", label: "Ready" },
    completed: { bg: "#F3E5F5", text: "#6A1B9A", label: "Completed" },
    shipped: { bg: "#E0F2F1", text: "#00695C", label: "Shipped" },
    rejected: { bg: "#FFEBEE", text: "#C62828", label: "Rejected" },
    cancelled: { bg: "#ECEFF1", text: "#546E7A", label: "Cancelled" },
  };

  const sc = statusColors[order.status] || statusColors.pending;
  const timeSince = getTimeSince(order.createdAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdRow}>
          <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.orderId}</Text>
          {order.isGiftOrder && (
            <View style={[styles.giftBadge, { backgroundColor: "#FCE4EC" }]}>
              <IconSymbol name="gift.fill" size={12} color="#C62828" />
              <Text style={{ fontSize: 10, color: "#C62828", fontWeight: "600" }}>Gift</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 2).map((item, i) => (
          <Text key={i} style={[styles.orderItemText, { color: colors.muted }]} numberOfLines={1}>
            {item.quantity}x {item.productName}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={[styles.orderItemText, { color: colors.muted }]}>
            +{order.items.length - 2} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderFooterLeft}>
          <IconSymbol
            name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"}
            size={14}
            color={order.deliveryMode === "express" ? colors.success : colors.primary}
          />
          <Text style={[styles.orderDelivery, { color: colors.muted }]}>
            {order.deliveryMode === "express" ? "Express" : "Shipping"}
          </Text>
          <Text style={[styles.orderTime, { color: colors.muted }]}>{timeSince}</Text>
        </View>
        <Text style={[styles.orderTotal, { color: colors.foreground }]}>
          {formatCurrency(order.storePayout)}
        </Text>
      </View>
    </TouchableOpacity>
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

export default function StoreDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { storeProfile, metrics, pendingOrders, activeOrders, completedOrders, setMode } = useStore();

  const allActiveOrders = [...pendingOrders, ...activeOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.muted }]}>Store Dashboard</Text>
              <Text style={[styles.storeName, { color: colors.foreground }]}>
                {storeProfile?.name || "My Store"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setMode("customer");
                router.replace("/(tabs)" as any);
              }}
              style={[styles.switchBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.triangle.2.circlepath" size={14} color={colors.primary} />
              <Text style={[styles.switchBtnText, { color: colors.primary }]}>Customer</Text>
            </TouchableOpacity>
          </View>

          {/* Live Status */}
          <View style={[styles.liveStatus, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveText, { color: colors.success }]}>Store is Live</Text>
            <Text style={[styles.liveSubtext, { color: colors.muted }]}>Accepting orders</Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Pending"
            value={String(metrics.pendingOrders)}
            icon="exclamationmark.triangle.fill"
            color="#E65100"
            bgColor="#FFF3E0"
          />
          <MetricCard
            label="Preparing"
            value={String(metrics.preparingOrders)}
            icon="clock.fill"
            color="#1565C0"
            bgColor="#E3F2FD"
          />
          <MetricCard
            label="Today's Orders"
            value={String(metrics.todayOrders)}
            icon="bag.fill"
            color="#2E7D32"
            bgColor="#E8F5E9"
          />
          <MetricCard
            label="Today's Revenue"
            value={formatCurrency(metrics.todayRevenue)}
            icon="dollarsign.circle.fill"
            color="#6A1B9A"
            bgColor="#F3E5F5"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => router.push("/store/orders" as any)}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="list.bullet" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/store/inventory" as any)}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="tray.full.fill" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/store/settings" as any)}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="gearshape.fill" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/store/analytics" as any)}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="chart.bar.fill" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Orders Alert */}
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => router.push("/store/orders" as any)}
              style={[styles.alertCard, { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" }]}
              activeOpacity={0.7}
            >
              <View style={styles.alertLeft}>
                <View style={[styles.alertBadge, { backgroundColor: "#E65100" }]}>
                  <Text style={styles.alertBadgeText}>{pendingOrders.length}</Text>
                </View>
                <View>
                  <Text style={[styles.alertTitle, { color: "#E65100" }]}>
                    New Orders Waiting
                  </Text>
                  <Text style={[styles.alertSubtitle, { color: "#BF360C" }]}>
                    Tap to review and accept
                  </Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#E65100" />
            </TouchableOpacity>
          </View>
        )}

        {/* Active Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Orders</Text>
            <TouchableOpacity onPress={() => router.push("/store/orders" as any)} activeOpacity={0.6}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {allActiveOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>All caught up! No active orders.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {allActiveOrders.slice(0, 5).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => router.push(`/store/order-detail/${order.id}` as any)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Weekly Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Orders</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{metrics.weeklyOrders}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Revenue</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {formatCurrency(metrics.weeklyRevenue)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Acceptance Rate</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {metrics.acceptanceRate}%
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Avg Rating</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <IconSymbol name="star.fill" size={14} color={colors.warning} />
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
  },
  storeName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  liveStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 14,
    fontWeight: "700",
  },
  liveSubtext: {
    fontSize: 12,
    marginLeft: "auto",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  metricCard: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  alertSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  orderCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontSize: 15,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  orderItems: {
    gap: 2,
  },
  orderItemText: {
    fontSize: 13,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderDelivery: {
    fontSize: 12,
    fontWeight: "500",
  },
  orderTime: {
    fontSize: 11,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryDivider: {
    height: 0.5,
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
