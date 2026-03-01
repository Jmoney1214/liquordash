import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAdmin, formatAdminCurrency, formatCompactNumber } from "@/lib/admin-store";

function KPICard({ label, value, subValue, icon, color, onPress }: {
  label: string; value: string; subValue?: string; icon: any; color: string; onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.kpiIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.muted }]}>{label}</Text>
      {subValue && <Text style={[styles.kpiSub, { color }]}>{subValue}</Text>}
    </TouchableOpacity>
  );
}

function AlertCard({ title, count, icon, color, onPress }: {
  title: string; count: number; icon: any; color: string; onPress: () => void;
}) {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.alertCard, { backgroundColor: color + "10", borderColor: color + "30" }]}
      activeOpacity={0.7}
    >
      <View style={[styles.alertIconWrap, { backgroundColor: color + "20" }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.alertCount, { color }]}>{count} pending</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={color} />
    </TouchableOpacity>
  );
}

function QuickAction({ label, icon, color, onPress }: {
  label: string; icon: any; color: string; onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickAction} activeOpacity={0.6}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.foreground }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function RevenueBar({ label, value, maxValue, color }: {
  label: string; value: number; maxValue: number; color: string;
}) {
  const colors = useColors();
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: colors.muted }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color: colors.foreground }]}>{formatAdminCurrency(value)}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const colors = useColors();
  const router = useRouter();
  const {
    metrics, revenueData, pendingStoreApps, pendingDriverApps, activeOrderCount,
    storeApplications, driverApprovals, platformOrders,
  } = useAdmin();

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));

  const recentOrders = [...platformOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin Dashboard</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>Platform Overview</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Alerts */}
        <View style={styles.section}>
          <AlertCard
            title="Store Applications"
            count={pendingStoreApps}
            icon="storefront.fill"
            color="#6A1B9A"
            onPress={() => router.push("/admin/store-applications" as any)}
          />
          <AlertCard
            title="Driver Approvals"
            count={pendingDriverApps}
            icon="car.fill"
            color="#1B6B3A"
            onPress={() => router.push("/admin/driver-management" as any)}
          />
          {activeOrderCount > 0 && (
            <AlertCard
              title="Active Orders"
              count={activeOrderCount}
              icon="bolt.fill"
              color="#0EA5E9"
              onPress={() => router.push("/admin/orders" as any)}
            />
          )}
        </View>

        {/* KPIs Row 1 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
          <View style={styles.kpiRow}>
            <KPICard
              label="Revenue"
              value={formatAdminCurrency(metrics.todayRevenue)}
              icon="dollarsign.circle.fill"
              color="#22C55E"
            />
            <KPICard
              label="Orders"
              value={metrics.todayOrders.toString()}
              icon="bag.fill"
              color="#3B82F6"
            />
            <KPICard
              label="New Users"
              value={metrics.todayNewCustomers.toString()}
              icon="person.fill"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* KPIs Row 2 - Platform Totals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Platform Totals</Text>
          <View style={styles.kpiRow}>
            <KPICard
              label="Total Revenue"
              value={formatAdminCurrency(metrics.totalRevenue)}
              subValue={`+${metrics.revenueGrowth}%`}
              icon="chart.bar.fill"
              color="#22C55E"
            />
            <KPICard
              label="Total Orders"
              value={formatCompactNumber(metrics.totalOrders)}
              subValue={`+${metrics.orderGrowth}%`}
              icon="list.bullet"
              color="#3B82F6"
            />
            <KPICard
              label="Customers"
              value={formatCompactNumber(metrics.totalCustomers)}
              subValue={`+${metrics.customerGrowth}%`}
              icon="person.2.fill"
              color="#8B5CF6"
            />
          </View>
          <View style={styles.kpiRow}>
            <KPICard
              label="Stores"
              value={metrics.totalStores.toString()}
              icon="storefront.fill"
              color="#6A1B9A"
              onPress={() => router.push("/admin/store-applications" as any)}
            />
            <KPICard
              label="Drivers"
              value={metrics.totalDrivers.toString()}
              icon="car.fill"
              color="#1B6B3A"
              onPress={() => router.push("/admin/driver-management" as any)}
            />
            <KPICard
              label="Commission"
              value={formatAdminCurrency(metrics.platformCommission)}
              icon="percent"
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Weekly Revenue Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Revenue</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {revenueData.map((d) => (
              <RevenueBar key={d.label} label={d.label} value={d.revenue} maxValue={maxRevenue} color={colors.primary} />
            ))}
            <View style={[styles.chartTotal, { borderColor: colors.border }]}>
              <Text style={[styles.chartTotalLabel, { color: colors.muted }]}>Week Total</Text>
              <Text style={[styles.chartTotalValue, { color: colors.foreground }]}>
                {formatAdminCurrency(metrics.weekRevenue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction label="Store Apps" icon="storefront.fill" color="#6A1B9A" onPress={() => router.push("/admin/store-applications" as any)} />
            <QuickAction label="Orders" icon="bag.fill" color="#3B82F6" onPress={() => router.push("/admin/orders" as any)} />
            <QuickAction label="Drivers" icon="car.fill" color="#1B6B3A" onPress={() => router.push("/admin/driver-management" as any)} />
            <QuickAction label="Users" icon="person.2.fill" color="#8B5CF6" onPress={() => router.push("/admin/users" as any)} />
            <QuickAction label="Analytics" icon="chart.bar.fill" color="#F59E0B" onPress={() => router.push("/admin/analytics" as any)} />
            <QuickAction label="Settings" icon="slider.horizontal.3" color="#6B7280" onPress={() => router.push("/admin/settings" as any)} />
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/admin/orders" as any)} activeOpacity={0.6}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.map((order) => {
            const statusColor = order.status === "delivered" ? "#22C55E" : order.status === "cancelled" ? "#EF4444" : "#3B82F6";
            return (
              <View key={order.id} style={[styles.orderRow, { borderColor: colors.border }]}>
                <View style={styles.orderLeft}>
                  <Text style={[styles.orderId, { color: colors.foreground }]}>{order.id}</Text>
                  <Text style={[styles.orderCustomer, { color: colors.muted }]}>{order.customerName}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={[styles.orderTotal, { color: colors.foreground }]}>{formatAdminCurrency(order.total)}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: statusColor + "15" }]}>
                    <Text style={[styles.orderStatusText, { color: statusColor }]}>
                      {order.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: "600" },
  // KPI
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  kpiValue: { fontSize: 16, fontWeight: "800" },
  kpiLabel: { fontSize: 11, marginTop: 2 },
  kpiSub: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  // Alert
  alertCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  alertIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "600" },
  alertCount: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  // Quick Actions
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickAction: { width: "30%", alignItems: "center", gap: 6 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  // Chart
  chartCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 32, fontSize: 11, fontWeight: "600" },
  barTrack: { flex: 1, height: 16, borderRadius: 8, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 8 },
  barValue: { width: 70, fontSize: 11, fontWeight: "600", textAlign: "right" },
  chartTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, marginTop: 4 },
  chartTotalLabel: { fontSize: 13, fontWeight: "600" },
  chartTotalValue: { fontSize: 15, fontWeight: "800" },
  // Orders
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  orderLeft: {},
  orderId: { fontSize: 14, fontWeight: "700" },
  orderCustomer: { fontSize: 12, marginTop: 2 },
  orderRight: { alignItems: "flex-end" },
  orderTotal: { fontSize: 14, fontWeight: "700" },
  orderStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  orderStatusText: { fontSize: 10, fontWeight: "700" },
});
