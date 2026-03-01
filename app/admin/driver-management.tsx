import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, TextInput, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  useAdmin,
  DriverApproval,
  DriverApprovalStatus,
  DRIVER_STATUS_COLORS,
  getTimeAgoAdmin,
} from "@/lib/admin-store";

type FilterTab = "all" | "pending" | "approved" | "suspended";

function DriverCard({ driver, onApprove, onSuspend, onReinstate }: {
  driver: DriverApproval;
  onApprove: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
}) {
  const colors = useColors();
  const statusColor = DRIVER_STATUS_COLORS[driver.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={[styles.driverAvatar, { backgroundColor: "#1B6B3A" + "20" }]}>
            <Text style={[styles.driverInitials, { color: "#1B6B3A" }]}>
              {driver.firstName[0]}{driver.lastName[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.driverName, { color: colors.foreground }]}>
              {driver.firstName} {driver.lastName}
            </Text>
            <Text style={[styles.driverEmail, { color: colors.muted }]}>{driver.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.driverMeta}>
          <View style={styles.metaRow}>
            <IconSymbol name="car.fill" size={13} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {driver.vehicleMake} {driver.vehicleModel} · {driver.licensePlate}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol name="clock.fill" size={13} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>Applied {getTimeAgoAdmin(driver.appliedAt)}</Text>
          </View>
          {driver.totalDeliveries > 0 && (
            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.statBadgeText, { color: colors.foreground }]}>{driver.totalDeliveries} deliveries</Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: colors.border }]}>
                <IconSymbol name="star.fill" size={11} color="#F59E0B" />
                <Text style={[styles.statBadgeText, { color: colors.foreground }]}>{driver.rating.toFixed(1)}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandedSection, { borderColor: colors.border }]}>
          <DetailRow label="Phone" value={driver.phone} colors={colors} />
          <DetailRow label="Vehicle Type" value={driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)} colors={colors} />
          <DetailRow label="Driver's License" value={driver.driversLicense} colors={colors} />
          <DetailRow label="Insurance" value={driver.insuranceNumber} colors={colors} />
          {driver.suspensionReason && (
            <View style={[styles.suspensionNote, { backgroundColor: "#EF4444" + "08" }]}>
              <Text style={[styles.suspensionLabel, { color: "#EF4444" }]}>Suspension Reason:</Text>
              <Text style={[styles.suspensionText, { color: colors.muted }]}>{driver.suspensionReason}</Text>
            </View>
          )}
        </View>
      )}

      {driver.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onApprove} style={[styles.actionBtn, { backgroundColor: "#22C55E" }]} activeOpacity={0.7}>
            <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSuspend} style={[styles.actionBtn, { backgroundColor: "#EF4444" }]} activeOpacity={0.7}>
            <IconSymbol name="xmark.circle.fill" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {driver.status === "approved" && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onSuspend} style={[styles.actionBtn, { backgroundColor: "#EF4444" }]} activeOpacity={0.7}>
            <IconSymbol name="nosign" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Suspend</Text>
          </TouchableOpacity>
        </View>
      )}

      {driver.status === "suspended" && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onReinstate} style={[styles.actionBtn, { backgroundColor: "#22C55E" }]} activeOpacity={0.7}>
            <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Reinstate</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function DriverManagementScreen() {
  const colors = useColors();
  const router = useRouter();
  const { driverApprovals, approveDriver, suspendDriver, rejectDriver, reinstateDriver } = useAdmin();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [targetDriverId, setTargetDriverId] = useState<string | null>(null);
  const [isReject, setIsReject] = useState(false);

  const filteredDrivers = driverApprovals.filter((d) => {
    if (filter === "all") return true;
    return d.status === filter;
  });

  const counts = {
    all: driverApprovals.length,
    pending: driverApprovals.filter((d) => d.status === "pending").length,
    approved: driverApprovals.filter((d) => d.status === "approved").length,
    suspended: driverApprovals.filter((d) => d.status === "suspended").length,
  };

  const handleApprove = (id: string) => {
    if (Platform.OS === "web") {
      approveDriver(id);
    } else {
      Alert.alert("Approve Driver", "Approve this driver application?", [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", onPress: () => approveDriver(id) },
      ]);
    }
  };

  const handleSuspendOrReject = (id: string, reject: boolean) => {
    setTargetDriverId(id);
    setIsReject(reject);
    setShowSuspendModal(true);
  };

  const confirmSuspend = () => {
    if (targetDriverId && suspendReason.trim()) {
      if (isReject) {
        rejectDriver(targetDriverId, suspendReason.trim());
      } else {
        suspendDriver(targetDriverId, suspendReason.trim());
      }
      setShowSuspendModal(false);
      setSuspendReason("");
      setTargetDriverId(null);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Driver Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#F59E0B" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>{counts.pending}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#22C55E" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{counts.approved}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#EF4444" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#EF4444" }]}>{counts.suspended}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Suspended</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["all", "pending", "approved", "suspended"] as FilterTab[]).map((tab) => (
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
        {filteredDrivers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="car.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No drivers found</Text>
          </View>
        ) : (
          filteredDrivers.map((d) => (
            <DriverCard
              key={d.id}
              driver={d}
              onApprove={() => handleApprove(d.id)}
              onSuspend={() => handleSuspendOrReject(d.id, d.status === "pending")}
              onReinstate={() => reinstateDriver(d.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Suspend/Reject Modal */}
      {showSuspendModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {isReject ? "Reject Driver" : "Suspend Driver"}
            </Text>
            <Text style={[styles.modalSub, { color: colors.muted }]}>
              Please provide a reason:
            </Text>
            <TextInput
              value={suspendReason}
              onChangeText={setSuspendReason}
              placeholder="Enter reason..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setShowSuspendModal(false); setSuspendReason(""); }}
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSuspend}
                style={[styles.modalBtn, { backgroundColor: "#EF4444", opacity: suspendReason.trim() ? 1 : 0.5 }]}
                activeOpacity={0.7}
                disabled={!suspendReason.trim()}
              >
                <Text style={styles.modalBtnTextWhite}>{isReject ? "Reject" : "Suspend"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  filterTabText: { fontSize: 12, fontWeight: "600" },
  // Card
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  driverInitials: { fontSize: 16, fontWeight: "700" },
  driverName: { fontSize: 15, fontWeight: "700" },
  driverEmail: { fontSize: 12, marginTop: 1 },
  driverMeta: { marginTop: 10, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statBadgeText: { fontSize: 11, fontWeight: "600" },
  // Status
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  // Expanded
  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: "600" },
  suspensionNote: { padding: 10, borderRadius: 8, marginTop: 6 },
  suspensionLabel: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  suspensionText: { fontSize: 12 },
  // Actions
  actions: { flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  // Empty
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  // Modal
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", maxWidth: 400, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalBtnText: { fontSize: 14, fontWeight: "600" },
  modalBtnTextWhite: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
