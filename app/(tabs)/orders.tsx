import { Text, View, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useOrders } from "@/lib/orders-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPrice, Order, OrderStatus } from "@/lib/data";
import { WsOfflineBanner } from "@/components/ws-status";

function getStatusColor(status: OrderStatus, colors: any) {
  switch (status) {
    case "confirmed":
      return colors.primary;
    case "preparing":
      return colors.warning;
    case "out-for-delivery":
    case "in-transit":
      return colors.primary;
    case "shipped":
      return colors.primary;
    case "delivered":
      return colors.success;
    case "cancelled":
      return colors.error;
    default:
      return colors.muted;
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Preparing";
    case "out-for-delivery":
      return "Out for Delivery";
    case "shipped":
      return "Shipped";
    case "in-transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function OrderCard({ order }: { order: Order }) {
  const colors = useColors();
  const router = useRouter();
  const statusColor = getStatusColor(order.status, colors);

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      onPress={() => router.push(`/order/${order.id}` as any)}
      style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderId, { color: colors.foreground }]}>{order.id}</Text>
          <Text style={[styles.orderDate, { color: colors.muted }]}>{dateStr}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 3).map((item, idx) => (
          <Image
            key={idx}
            source={item.product.imageUrl}
            style={styles.orderThumb}
            contentFit="cover"
            transition={200}
          />
        ))}
        {order.items.length > 3 && (
          <View style={[styles.moreItems, { backgroundColor: colors.border }]}>
            <Text style={[styles.moreText, { color: colors.muted }]}>+{order.items.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.deliveryInfo}>
          <IconSymbol
            name={order.deliveryMode === "express" ? "bolt.fill" : "shippingbox.fill"}
            size={14}
            color={colors.muted}
          />
          <Text style={[styles.deliveryText, { color: colors.muted }]}>
            {order.deliveryMode === "express" ? "Express Delivery" : "Shipped"}
          </Text>
        </View>
        <Text style={[styles.orderTotal, { color: colors.foreground }]}>
          {formatPrice(order.total)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const { activeOrders, pastOrders } = useOrders();
  const [tab, setTab] = useState<"active" | "past">("active");

  const orders = tab === "active" ? activeOrders : pastOrders;

  return (
    <ScreenContainer>
      <WsOfflineBanner />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Orders</Text>
      </View>

      <View style={[styles.tabBar, { borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setTab("active")}
          style={[styles.tabBtn, tab === "active" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: tab === "active" ? colors.primary : colors.muted }]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("past")}
          style={[styles.tabBtn, tab === "past" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: tab === "past" ? colors.primary : colors.muted }]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{tab === "active" ? "📦" : "📋"}</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {tab === "active" ? "No active orders" : "No past orders"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {tab === "active"
                ? "Your active orders will appear here"
                : "Your completed orders will appear here"}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700",
  },
  orderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderItems: {
    flexDirection: "row",
    gap: 8,
  },
  orderThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  moreItems: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
