import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDriver, formatCurrency, DriverEarning } from "@/lib/driver-store";

type Period = "today" | "week" | "month" | "all";

function EarningRow({ earning }: { earning: DriverEarning }) {
  const colors = useColors();
  const date = new Date(earning.date);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <View style={[eStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[eStyles.icon, { backgroundColor: "#1B6B3A15" }]}>
        <IconSymbol name="shippingbox.fill" size={18} color="#1B6B3A" />
      </View>
      <View style={eStyles.info}>
        <Text style={[eStyles.jobId, { color: colors.foreground }]}>Delivery #{earning.jobId}</Text>
        <Text style={[eStyles.date, { color: colors.muted }]}>{dateStr} at {timeStr}</Text>
      </View>
      <View style={eStyles.amounts}>
        <Text style={[eStyles.total, { color: "#1B6B3A" }]}>+{formatCurrency(earning.totalEarned)}</Text>
        <Text style={[eStyles.breakdown, { color: colors.muted }]}>
          {formatCurrency(earning.basePay)} + {formatCurrency(earning.tipAmount)} tip
          {earning.bonusAmount > 0 ? ` + ${formatCurrency(earning.bonusAmount)} bonus` : ""}
        </Text>
      </View>
    </View>
  );
}

const eStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  jobId: { fontSize: 14, fontWeight: "600" },
  date: { fontSize: 12, marginTop: 1 },
  amounts: { alignItems: "flex-end" },
  total: { fontSize: 15, fontWeight: "700" },
  breakdown: { fontSize: 10, marginTop: 1 },
});

export default function DriverEarningsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { earnings, earningsSummary } = useDriver();
  const [period, setPeriod] = useState<Period>("week");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - (now.getDay() * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredEarnings = earnings.filter((e) => {
    const t = new Date(e.date).getTime();
    if (period === "today") return t >= todayStart;
    if (period === "week") return t >= weekStart;
    if (period === "month") return t >= monthStart;
    return true;
  });

  const periodTotal = filteredEarnings.reduce((s, e) => s + e.totalEarned, 0);
  const periodBase = filteredEarnings.reduce((s, e) => s + e.basePay, 0);
  const periodTips = filteredEarnings.reduce((s, e) => s + e.tipAmount, 0);
  const periodBonuses = filteredEarnings.reduce((s, e) => s + e.bonusAmount, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Big Total */}
        <View style={[styles.totalCard, { backgroundColor: "#1B6B3A" }]}>
          <Text style={styles.totalLabel}>
            {period === "today" ? "Today's" : period === "week" ? "This Week's" : period === "month" ? "This Month's" : "Total"} Earnings
          </Text>
          <Text style={styles.totalAmount}>{formatCurrency(periodTotal)}</Text>
          <Text style={styles.totalDeliveries}>{filteredEarnings.length} deliveries</Text>

          <View style={styles.totalBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Base Pay</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(periodBase)}</Text>
            </View>
            <View style={[styles.breakdownDivider]} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Tips</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(periodTips)}</Text>
            </View>
            <View style={[styles.breakdownDivider]} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Bonuses</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(periodBonuses)}</Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(["today", "week", "month", "all"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, { backgroundColor: period === p ? "#1B6B3A" : colors.surface, borderColor: period === p ? "#1B6B3A" : colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodBtnText, { color: period === p ? "#fff" : colors.foreground }]}>
                {p === "today" ? "Today" : p === "week" ? "Week" : p === "month" ? "Month" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color="#1B6B3A" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {filteredEarnings.length > 0 ? formatCurrency(periodTotal / filteredEarnings.length) : "$0.00"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg/Delivery</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="star.fill" size={20} color="#F59E0B" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{earningsSummary.averageRating}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Rating</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="trophy.fill" size={20} color="#8B5CF6" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{earningsSummary.totalDeliveries}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
          </View>
        </View>

        {/* Earnings List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transaction History</Text>
          {filteredEarnings.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="dollarsign.circle.fill" size={36} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Earnings Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Complete deliveries to start earning</Text>
            </View>
          ) : (
            filteredEarnings.map((e) => <EarningRow key={e.id} earning={e} />)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  totalCard: { marginHorizontal: 16, padding: 20, borderRadius: 16, alignItems: "center" },
  totalLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  totalAmount: { color: "#fff", fontSize: 40, fontWeight: "800", marginTop: 4 },
  totalDeliveries: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 },
  totalBreakdown: { flexDirection: "row", marginTop: 16, gap: 16 },
  breakdownItem: { alignItems: "center" },
  breakdownLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500" },
  breakdownValue: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 },
  breakdownDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  periodRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 16 },
  periodBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  periodBtnText: { fontSize: 13, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  listSection: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyState: { alignItems: "center", padding: 30, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13 },
});
