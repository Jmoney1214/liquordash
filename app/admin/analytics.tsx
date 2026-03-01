import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAdmin, formatAdminCurrency, formatCompactNumber } from "@/lib/admin-store";

type Period = "today" | "week" | "month" | "all";

function MetricCard({ label, value, change, icon, color }: {
  label: string; value: string; change?: string; icon: any; color: string;
}) {
  const colors = useColors();
  const isPositive = change && change.startsWith("+");
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + "15" }]}>
          <IconSymbol name={icon} size={18} color={color} />
        </View>
        {change && (
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? "#22C55E15" : "#EF444415" }]}>
            <IconSymbol name={isPositive ? "arrow.up.right" : "arrow.down.right"} size={10} color={isPositive ? "#22C55E" : "#EF4444"} />
            <Text style={[styles.changeText, { color: isPositive ? "#22C55E" : "#EF4444" }]}>{change}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function BarChart({ data, maxValue, color }: {
  data: { label: string; value: number }[];
  maxValue: number;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.barChart}>
      <View style={styles.barsContainer}>
        {data.map((d) => {
          const pct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          return (
            <View key={d.label} style={styles.barColumn}>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.barLabel, { color: colors.muted }]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TopItem({ rank, label, value, subLabel, color }: {
  rank: number; label: string; value: string; subLabel: string; color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.topItem, { borderColor: colors.border }]}>
      <View style={[styles.rankBadge, { backgroundColor: color + "15" }]}>
        <Text style={[styles.rankText, { color }]}>{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.topItemLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.topItemSub, { color: colors.muted }]}>{subLabel}</Text>
      </View>
      <Text style={[styles.topItemValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { metrics, revenueData, platformOrders, platformUsers } = useAdmin();
  const [period, setPeriod] = useState<Period>("week");

  const revenueByDay = revenueData.map((d) => ({ label: d.label, value: d.revenue }));
  const ordersByDay = revenueData.map((d) => ({ label: d.label, value: d.orders }));
  const commissionByDay = revenueData.map((d) => ({ label: d.label, value: d.commission }));
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
  const maxOrders = Math.max(...revenueData.map((d) => d.orders));
  const maxCommission = Math.max(...revenueData.map((d) => d.commission));

  // Top stores by order count
  const storeOrderCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  platformOrders.forEach((o) => {
    if (!storeOrderCounts[o.storeId]) storeOrderCounts[o.storeId] = { name: o.storeName, count: 0, revenue: 0 };
    storeOrderCounts[o.storeId].count++;
    storeOrderCounts[o.storeId].revenue += o.total;
  });
  const topStores = Object.values(storeOrderCounts).sort((a, b) => b.revenue - a.revenue);

  // Top customers by spend
  const topCustomers = [...platformUsers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  // Delivery mode breakdown
  const expressOrders = platformOrders.filter((o) => o.deliveryMode === "express").length;
  const shippingOrders = platformOrders.filter((o) => o.deliveryMode === "shipping").length;
  const expressPct = platformOrders.length > 0 ? Math.round((expressOrders / platformOrders.length) * 100) : 0;

  const periodRevenue = period === "today" ? metrics.todayRevenue : period === "week" ? metrics.weekRevenue : period === "month" ? metrics.monthRevenue : metrics.totalRevenue;
  const periodOrders = period === "today" ? metrics.todayOrders : period === "week" ? metrics.weekOrders : period === "month" ? metrics.monthOrders : metrics.totalOrders;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(["today", "week", "month", "all"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodTab, period === p && { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodTabText, { color: period === p ? "#fff" : colors.muted }]}>
              {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Key Metrics */}
        <View style={styles.section}>
          <View style={styles.metricsGrid}>
            <MetricCard label="Revenue" value={formatAdminCurrency(periodRevenue)} change={`+${metrics.revenueGrowth}%`} icon="dollarsign.circle.fill" color="#22C55E" />
            <MetricCard label="Orders" value={formatCompactNumber(periodOrders)} change={`+${metrics.orderGrowth}%`} icon="bag.fill" color="#3B82F6" />
            <MetricCard label="Avg Order" value={formatAdminCurrency(metrics.avgOrderValue)} icon="chart.bar.fill" color="#8B5CF6" />
            <MetricCard label="Commission" value={formatAdminCurrency(metrics.platformCommission)} icon="percent" color="#F59E0B" />
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revenue Trend</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart data={revenueByDay} maxValue={maxRevenue} color="#22C55E" />
          </View>
        </View>

        {/* Orders Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Orders Trend</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart data={ordersByDay} maxValue={maxOrders} color="#3B82F6" />
          </View>
        </View>

        {/* Commission Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Commission Earned</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart data={commissionByDay} maxValue={maxCommission} color="#F59E0B" />
          </View>
        </View>

        {/* Delivery Mode Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Breakdown</Text>
          <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: "#0EA5E9" }]} />
                <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Express</Text>
                <Text style={[styles.breakdownValue, { color: colors.foreground }]}>{expressOrders} ({expressPct}%)</Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: "#8B5CF6" }]} />
                <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Shipping</Text>
                <Text style={[styles.breakdownValue, { color: colors.foreground }]}>{shippingOrders} ({100 - expressPct}%)</Text>
              </View>
            </View>
            <View style={[styles.breakdownBar, { backgroundColor: colors.border }]}>
              <View style={[styles.breakdownBarFill, { width: `${expressPct}%`, backgroundColor: "#0EA5E9" }]} />
              <View style={[styles.breakdownBarFill, { width: `${100 - expressPct}%`, backgroundColor: "#8B5CF6" }]} />
            </View>
          </View>
        </View>

        {/* Top Stores */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Stores</Text>
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {topStores.map((store, i) => (
              <TopItem
                key={store.name}
                rank={i + 1}
                label={store.name}
                value={formatAdminCurrency(store.revenue)}
                subLabel={`${store.count} orders`}
                color={i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : "#CD7F32"}
              />
            ))}
          </View>
        </View>

        {/* Top Customers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Customers</Text>
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {topCustomers.map((user, i) => (
              <TopItem
                key={user.id}
                rank={i + 1}
                label={user.name}
                value={formatAdminCurrency(user.totalSpent)}
                subLabel={`${user.totalOrders} orders · ${user.rewardsTier}`}
                color={i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : "#CD7F32"}
              />
            ))}
          </View>
        </View>

        {/* Platform Health */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Platform Health</Text>
          <View style={[styles.healthCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.healthRow}>
              <Text style={[styles.healthLabel, { color: colors.muted }]}>Active Stores</Text>
              <Text style={[styles.healthValue, { color: "#22C55E" }]}>{metrics.totalStores}</Text>
            </View>
            <View style={styles.healthRow}>
              <Text style={[styles.healthLabel, { color: colors.muted }]}>Active Drivers</Text>
              <Text style={[styles.healthValue, { color: "#22C55E" }]}>{metrics.totalDrivers}</Text>
            </View>
            <View style={styles.healthRow}>
              <Text style={[styles.healthLabel, { color: colors.muted }]}>Active Orders</Text>
              <Text style={[styles.healthValue, { color: "#3B82F6" }]}>{metrics.activeOrders}</Text>
            </View>
            <View style={styles.healthRow}>
              <Text style={[styles.healthLabel, { color: colors.muted }]}>Customer Growth</Text>
              <Text style={[styles.healthValue, { color: "#22C55E" }]}>+{metrics.customerGrowth}%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center" },
  periodRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  periodTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  periodTabText: { fontSize: 12, fontWeight: "600" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  // Metrics Grid
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "48%", padding: 14, borderRadius: 12, borderWidth: 1 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 18, fontWeight: "800" },
  metricLabel: { fontSize: 11, marginTop: 2 },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  changeText: { fontSize: 10, fontWeight: "700" },
  // Chart
  chartCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  barChart: {},
  barsContainer: { flexDirection: "row", justifyContent: "space-between", gap: 4, height: 120 },
  barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barTrack: { width: "80%", height: "100%", borderRadius: 6, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: "600", marginTop: 4 },
  // Breakdown
  breakdownCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  breakdownItem: { alignItems: "center", gap: 4 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 12 },
  breakdownValue: { fontSize: 14, fontWeight: "700" },
  breakdownBar: { height: 12, borderRadius: 6, flexDirection: "row", overflow: "hidden" },
  breakdownBarFill: { height: "100%" },
  // Top Items
  listCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  topItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 13, fontWeight: "800" },
  topItemLabel: { fontSize: 14, fontWeight: "600" },
  topItemSub: { fontSize: 11, marginTop: 1 },
  topItemValue: { fontSize: 14, fontWeight: "700" },
  // Health
  healthCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  healthRow: { flexDirection: "row", justifyContent: "space-between" },
  healthLabel: { fontSize: 13 },
  healthValue: { fontSize: 14, fontWeight: "700" },
});
