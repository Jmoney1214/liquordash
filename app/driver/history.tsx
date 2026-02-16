import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDriver, formatCurrency, JOB_STATUS_LABELS, JOB_STATUS_COLORS, DeliveryJob } from "@/lib/driver-store";

function HistoryCard({ job }: { job: DeliveryJob }) {
  const colors = useColors();
  const date = new Date(job.deliveredAt || job.createdAt);
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const statusColor = JOB_STATUS_COLORS[job.status];

  return (
    <View style={[hStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={hStyles.cardHeader}>
        <View style={hStyles.cardLeft}>
          <View style={[hStyles.statusDot, { backgroundColor: statusColor }]} />
          <View>
            <Text style={[hStyles.orderId, { color: colors.foreground }]}>{job.orderId}</Text>
            <Text style={[hStyles.date, { color: colors.muted }]}>{dateStr} at {timeStr}</Text>
          </View>
        </View>
        <Text style={[hStyles.pay, { color: "#1B6B3A" }]}>{formatCurrency(job.totalPay)}</Text>
      </View>

      <View style={hStyles.route}>
        <View style={hStyles.routeRow}>
          <IconSymbol name="storefront.fill" size={14} color="#3B82F6" />
          <Text style={[hStyles.routeText, { color: colors.foreground }]} numberOfLines={1}>{job.storeName}</Text>
        </View>
        <View style={hStyles.routeRow}>
          <IconSymbol name="location.fill" size={14} color="#10B981" />
          <Text style={[hStyles.routeText, { color: colors.foreground }]} numberOfLines={1}>{job.customerName} • {job.deliveryAddress}</Text>
        </View>
      </View>

      <View style={hStyles.meta}>
        <Text style={[hStyles.metaText, { color: colors.muted }]}>{job.itemCount} items</Text>
        <Text style={[hStyles.metaText, { color: colors.muted }]}>•</Text>
        <Text style={[hStyles.metaText, { color: colors.muted }]}>{job.estimatedDistance}</Text>
        <Text style={[hStyles.metaText, { color: colors.muted }]}>•</Text>
        <View style={[hStyles.statusBadge, { backgroundColor: statusColor + "15" }]}>
          <Text style={[hStyles.statusText, { color: statusColor }]}>{JOB_STATUS_LABELS[job.status]}</Text>
        </View>
      </View>
    </View>
  );
}

const hStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  orderId: { fontSize: 15, fontWeight: "700" },
  date: { fontSize: 11, marginTop: 1 },
  pay: { fontSize: 18, fontWeight: "800" },
  route: { gap: 6, marginBottom: 8 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeText: { fontSize: 13, flex: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
});

export default function DriverHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { completedJobs, earningsSummary } = useDriver();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Delivery History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{completedJobs.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Completed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryValue, { color: "#1B6B3A" }]}>{formatCurrency(earningsSummary.totalEarnings)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Earned</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>{earningsSummary.averageRating}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Rating</Text>
          </View>
        </View>

        {/* History List */}
        <View style={styles.listSection}>
          {completedJobs.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="clock.arrow.circlepath" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Deliveries Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Your completed deliveries will appear here.
              </Text>
            </View>
          ) : (
            completedJobs.map((job) => <HistoryCard key={job.id} job={job} />)
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
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 11 },
  listSection: { paddingHorizontal: 16 },
  emptyState: { alignItems: "center", padding: 30, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});
