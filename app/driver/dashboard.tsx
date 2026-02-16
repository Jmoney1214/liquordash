import { useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Alert, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDriver, formatCurrency, getTimeAgo, DeliveryJob } from "@/lib/driver-store";

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function JobCard({ job, onAccept }: { job: DeliveryJob; onAccept: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.jobHeader}>
        <View style={styles.jobStore}>
          <IconSymbol name="storefront.fill" size={16} color={colors.primary} />
          <Text style={[styles.jobStoreName, { color: colors.foreground }]}>{job.storeName}</Text>
        </View>
        <Text style={[styles.jobPay, { color: "#1B6B3A" }]}>{formatCurrency(job.totalPay)}</Text>
      </View>

      <View style={styles.jobRoute}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#3B82F6" }]} />
          <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{job.storeAddress}</Text>
        </View>
        <View style={[styles.routeLine, { borderColor: colors.border }]} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#10B981" }]} />
          <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{job.deliveryAddress}</Text>
        </View>
      </View>

      <View style={styles.jobMeta}>
        <View style={styles.jobMetaItem}>
          <IconSymbol name="shippingbox.fill" size={14} color={colors.muted} />
          <Text style={[styles.jobMetaText, { color: colors.muted }]}>{job.itemCount} items</Text>
        </View>
        <View style={styles.jobMetaItem}>
          <IconSymbol name="scope" size={14} color={colors.muted} />
          <Text style={[styles.jobMetaText, { color: colors.muted }]}>{job.estimatedDistance}</Text>
        </View>
        <View style={styles.jobMetaItem}>
          <IconSymbol name="timer" size={14} color={colors.muted} />
          <Text style={[styles.jobMetaText, { color: colors.muted }]}>{job.estimatedTime}</Text>
        </View>
        <Text style={[styles.jobTime, { color: colors.muted }]}>{getTimeAgo(job.createdAt)}</Text>
      </View>

      <View style={styles.jobPayBreakdown}>
        <Text style={[styles.payBreakdown, { color: colors.muted }]}>
          Base: {formatCurrency(job.basePay)} + Tip: {formatCurrency(job.tipAmount)}
        </Text>
      </View>

      <TouchableOpacity onPress={onAccept} style={[styles.acceptBtn, { backgroundColor: "#1B6B3A" }]} activeOpacity={0.7}>
        <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
        <Text style={styles.acceptBtnText}>Accept Delivery</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DriverDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isOnline, profile, activeJob, availableJobs, earningsSummary, goOnline, goOffline, acceptJob } = useDriver();

  const handleToggleOnline = () => {
    if (isOnline) {
      Alert.alert("Go Offline?", "You won't receive new delivery requests.", [
        { text: "Cancel", style: "cancel" },
        { text: "Go Offline", onPress: goOffline, style: "destructive" },
      ]);
    } else {
      goOnline();
    }
  };

  const handleAcceptJob = (job: DeliveryJob) => {
    Alert.alert("Accept Delivery?", `${job.storeName} → ${job.deliveryAddress}\n\nEst. ${job.estimatedTime} • ${formatCurrency(job.totalPay)}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Accept", onPress: () => { acceptJob(job); router.push("/driver/active-delivery" as any); } },
    ]);
  };

  // Auto-navigate to active delivery if there is one
  useEffect(() => {
    if (activeJob && activeJob.status !== "delivered") {
      // Don't auto-navigate, let user tap
    }
  }, [activeJob]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Driver Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {profile.firstName} {profile.lastName} • ★ {profile.rating.toFixed(1)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/driver/profile" as any)} activeOpacity={0.6}>
          <View style={[styles.headerAvatar, { backgroundColor: "#1B6B3A" }]}>
            <Text style={styles.headerAvatarText}>{profile.avatarInitials || "D"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Online Toggle */}
        <TouchableOpacity
          onPress={handleToggleOnline}
          style={[styles.onlineToggle, { backgroundColor: isOnline ? "#1B6B3A" : colors.surface, borderColor: isOnline ? "#1B6B3A" : colors.border }]}
          activeOpacity={0.7}
        >
          <View style={styles.onlineLeft}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? "#4ADE80" : colors.muted }]} />
            <View>
              <Text style={[styles.onlineTitle, { color: isOnline ? "#fff" : colors.foreground }]}>
                {isOnline ? "You're Online" : "You're Offline"}
              </Text>
              <Text style={[styles.onlineSubtitle, { color: isOnline ? "rgba(255,255,255,0.7)" : colors.muted }]}>
                {isOnline ? "Accepting delivery requests" : "Tap to start accepting deliveries"}
              </Text>
            </View>
          </View>
          <IconSymbol name="power" size={28} color={isOnline ? "#fff" : colors.muted} />
        </TouchableOpacity>

        {/* Active Job Banner */}
        {activeJob && activeJob.status !== "delivered" && (
          <TouchableOpacity
            onPress={() => router.push("/driver/active-delivery" as any)}
            style={[styles.activeJobBanner, { backgroundColor: "#F59E0B" }]}
            activeOpacity={0.7}
          >
            <View style={styles.activeJobLeft}>
              <IconSymbol name="bolt.fill" size={20} color="#fff" />
              <View>
                <Text style={styles.activeJobTitle}>Active Delivery</Text>
                <Text style={styles.activeJobSubtitle}>{activeJob.storeName} → {activeJob.customerName}</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Today's Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Summary</Text>
          <View style={styles.statsRow}>
            <StatCard label="Earned" value={formatCurrency(earningsSummary.today)} icon="dollarsign.circle.fill" color="#1B6B3A" />
            <StatCard label="Deliveries" value={`${earningsSummary.totalDeliveries}`} icon="shippingbox.fill" color="#3B82F6" />
            <StatCard label="Rating" value={`${earningsSummary.averageRating}`} icon="star.fill" color="#F59E0B" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            onPress={() => router.push("/driver/earnings" as any)}
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="dollarsign.circle.fill" size={22} color="#1B6B3A" />
            <Text style={[styles.quickBtnText, { color: colors.foreground }]}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/driver/history" as any)}
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="clock.arrow.circlepath" size={22} color="#3B82F6" />
            <Text style={[styles.quickBtnText, { color: colors.foreground }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/driver/profile" as any)}
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={22} color="#8B5CF6" />
            <Text style={[styles.quickBtnText, { color: colors.foreground }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Available Jobs */}
        {isOnline && (
          <View style={styles.jobsSection}>
            <View style={styles.jobsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available Deliveries</Text>
              <Text style={[styles.jobsCount, { color: colors.muted }]}>{availableJobs.length} nearby</Text>
            </View>
            {availableJobs.length === 0 ? (
              <View style={[styles.emptyJobs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="scope" size={40} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Deliveries Nearby</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>New orders will appear here automatically</Text>
              </View>
            ) : (
              availableJobs.map((job) => (
                <JobCard key={job.id} job={job} onAccept={() => handleAcceptJob(job)} />
              ))
            )}
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineSection}>
            <View style={[styles.offlineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="car.fill" size={48} color={colors.muted} />
              <Text style={[styles.offlineTitle, { color: colors.foreground }]}>Ready to Drive?</Text>
              <Text style={[styles.offlineSubtitle, { color: colors.muted }]}>
                Go online to start receiving delivery requests from nearby stores.
              </Text>
              <View style={styles.offlineStats}>
                <View style={styles.offlineStatItem}>
                  <Text style={[styles.offlineStatValue, { color: "#1B6B3A" }]}>{formatCurrency(earningsSummary.thisWeek)}</Text>
                  <Text style={[styles.offlineStatLabel, { color: colors.muted }]}>This Week</Text>
                </View>
                <View style={[styles.offlineDivider, { backgroundColor: colors.border }]} />
                <View style={styles.offlineStatItem}>
                  <Text style={[styles.offlineStatValue, { color: "#1B6B3A" }]}>{earningsSummary.totalDeliveries}</Text>
                  <Text style={[styles.offlineStatLabel, { color: colors.muted }]}>Total Deliveries</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  onlineToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  onlineLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  onlineDot: { width: 12, height: 12, borderRadius: 6 },
  onlineTitle: { fontSize: 16, fontWeight: "700" },
  onlineSubtitle: { fontSize: 12, marginTop: 1 },
  activeJobBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, padding: 14, borderRadius: 12, marginBottom: 12 },
  activeJobLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  activeJobTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  activeJobSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 1 },
  statsSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500" },
  quickActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  quickBtn: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  quickBtnText: { fontSize: 12, fontWeight: "600" },
  jobsSection: { paddingHorizontal: 16 },
  jobsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  jobsCount: { fontSize: 13 },
  jobCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  jobStore: { flexDirection: "row", alignItems: "center", gap: 6 },
  jobStoreName: { fontSize: 15, fontWeight: "700" },
  jobPay: { fontSize: 20, fontWeight: "800" },
  jobRoute: { marginBottom: 10 },
  routePoint: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { fontSize: 13, flex: 1 },
  routeLine: { width: 1, height: 16, marginLeft: 4, borderLeftWidth: 1, borderStyle: "dashed" },
  jobMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  jobMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  jobMetaText: { fontSize: 12 },
  jobTime: { fontSize: 12, marginLeft: "auto" },
  jobPayBreakdown: { marginBottom: 10 },
  payBreakdown: { fontSize: 12 },
  acceptBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10 },
  acceptBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  emptyJobs: { alignItems: "center", padding: 30, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  offlineSection: { paddingHorizontal: 16 },
  offlineCard: { alignItems: "center", padding: 30, borderRadius: 16, borderWidth: 1, gap: 8 },
  offlineTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  offlineSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  offlineStats: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 20 },
  offlineStatItem: { alignItems: "center" },
  offlineStatValue: { fontSize: 20, fontWeight: "800" },
  offlineStatLabel: { fontSize: 11, marginTop: 2 },
  offlineDivider: { width: 1, height: 30 },
});
