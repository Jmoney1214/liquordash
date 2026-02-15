import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";
import { formatCurrency } from "@/lib/store-data";

function StatBlock({
  label,
  value,
  subValue,
  trend,
}: {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const colors = useColors();
  return (
    <View style={[styles.statBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      {subValue && (
        <Text
          style={[
            styles.statSubValue,
            {
              color:
                trend === "up" ? colors.success : trend === "down" ? colors.error : colors.muted,
            },
          ]}
        >
          {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}
          {subValue}
        </Text>
      )}
    </View>
  );
}

function BarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  const colors = useColors();
  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.barColumn}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: `${Math.max((item.value / maxValue) * 100, 3)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.barLabel, { color: colors.muted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StoreAnalyticsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { metrics, storeOrders, storeProfile } = useStore();

  // Generate sample weekly data
  const weeklyData = [
    { label: "Mon", value: 12 },
    { label: "Tue", value: 18 },
    { label: "Wed", value: 15 },
    { label: "Thu", value: 22 },
    { label: "Fri", value: 35 },
    { label: "Sat", value: 42 },
    { label: "Sun", value: 28 },
  ];

  const revenueData = [
    { label: "Mon", value: 450 },
    { label: "Tue", value: 680 },
    { label: "Wed", value: 520 },
    { label: "Thu", value: 890 },
    { label: "Fri", value: 1250 },
    { label: "Sat", value: 1680 },
    { label: "Sun", value: 980 },
  ];

  const totalWeeklyOrders = weeklyData.reduce((s, d) => s + d.value, 0);
  const totalWeeklyRevenue = revenueData.reduce((s, d) => s + d.value, 0);
  const avgOrderValue = totalWeeklyOrders > 0 ? totalWeeklyRevenue / totalWeeklyOrders : 0;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week Overview</Text>
          <View style={styles.statsGrid}>
            <StatBlock
              label="Total Orders"
              value={String(totalWeeklyOrders)}
              subValue="+12% vs last week"
              trend="up"
            />
            <StatBlock
              label="Revenue"
              value={formatCurrency(totalWeeklyRevenue)}
              subValue="+8% vs last week"
              trend="up"
            />
            <StatBlock
              label="Avg Order Value"
              value={formatCurrency(avgOrderValue)}
              subValue="-3% vs last week"
              trend="down"
            />
            <StatBlock
              label="Acceptance Rate"
              value={`${metrics.acceptanceRate}%`}
              subValue="Excellent"
              trend="neutral"
            />
          </View>
        </View>

        {/* Orders Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Orders This Week</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart data={weeklyData} maxValue={Math.max(...weeklyData.map((d) => d.value))} />
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revenue This Week</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart data={revenueData} maxValue={Math.max(...revenueData.map((d) => d.value))} />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Performance</Text>
          <View style={[styles.perfCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.perfRow}>
              <Text style={[styles.perfLabel, { color: colors.muted }]}>Average Prep Time</Text>
              <Text style={[styles.perfValue, { color: colors.foreground }]}>
                {storeProfile?.averagePrepTime || 10} min
              </Text>
            </View>
            <View style={[styles.perfDivider, { backgroundColor: colors.border }]} />
            <View style={styles.perfRow}>
              <Text style={[styles.perfLabel, { color: colors.muted }]}>Customer Rating</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <IconSymbol name="star.fill" size={14} color={colors.warning} />
                <Text style={[styles.perfValue, { color: colors.foreground }]}>
                  {storeProfile?.averageRating?.toFixed(1) || "N/A"}
                </Text>
              </View>
            </View>
            <View style={[styles.perfDivider, { backgroundColor: colors.border }]} />
            <View style={styles.perfRow}>
              <Text style={[styles.perfLabel, { color: colors.muted }]}>Total Reviews</Text>
              <Text style={[styles.perfValue, { color: colors.foreground }]}>
                {storeProfile?.reviewCount || 0}
              </Text>
            </View>
            <View style={[styles.perfDivider, { backgroundColor: colors.border }]} />
            <View style={styles.perfRow}>
              <Text style={[styles.perfLabel, { color: colors.muted }]}>Express Orders</Text>
              <Text style={[styles.perfValue, { color: colors.foreground }]}>
                {storeOrders.filter((o) => o.deliveryMode === "express").length}
              </Text>
            </View>
            <View style={[styles.perfDivider, { backgroundColor: colors.border }]} />
            <View style={styles.perfRow}>
              <Text style={[styles.perfLabel, { color: colors.muted }]}>Shipping Orders</Text>
              <Text style={[styles.perfValue, { color: colors.foreground }]}>
                {storeOrders.filter((o) => o.deliveryMode === "shipping").length}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Selling Products</Text>
          <View style={[styles.perfCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { name: "Maker's Mark Bourbon", orders: 45, revenue: 1349.55 },
              { name: "Grey Goose Vodka", orders: 38, revenue: 1329.62 },
              { name: "Veuve Clicquot", orders: 32, revenue: 1919.68 },
              { name: "Hendrick's Gin", orders: 28, revenue: 1035.72 },
              { name: "Don Julio 1942", orders: 22, revenue: 3299.78 },
            ].map((product, i) => (
              <View key={i}>
                {i > 0 && <View style={[styles.perfDivider, { backgroundColor: colors.border }]} />}
                <View style={styles.topProductRow}>
                  <View style={[styles.rankBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.rankText, { color: colors.primary }]}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topProductName, { color: colors.foreground }]}>
                      {product.name}
                    </Text>
                    <Text style={[styles.topProductOrders, { color: colors.muted }]}>
                      {product.orders} orders
                    </Text>
                  </View>
                  <Text style={[styles.topProductRevenue, { color: colors.foreground }]}>
                    {formatCurrency(product.revenue)}
                  </Text>
                </View>
              </View>
            ))}
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBlock: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statSubValue: {
    fontSize: 11,
    fontWeight: "500",
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  chartContainer: {
    flexDirection: "row",
    height: 150,
    gap: 4,
    alignItems: "flex-end",
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "70%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  perfCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  perfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  perfDivider: {
    height: 0.5,
    marginHorizontal: 16,
  },
  perfLabel: {
    fontSize: 14,
  },
  perfValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  topProductRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  topProductName: {
    fontSize: 14,
    fontWeight: "600",
  },
  topProductOrders: {
    fontSize: 11,
    marginTop: 1,
  },
  topProductRevenue: {
    fontSize: 15,
    fontWeight: "700",
  },
});
