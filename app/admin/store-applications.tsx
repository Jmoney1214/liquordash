import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  useAdmin,
  StoreApplicationReview,
  AppReviewStatus,
  APP_REVIEW_STATUS_COLORS,
  getTimeAgoAdmin,
} from "@/lib/admin-store";

type FilterTab = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: AppReviewStatus }) {
  const color = APP_REVIEW_STATUS_COLORS[status];
  const label = status === "under_review" ? "Under Review" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View style={[styles.statusBadge, { backgroundColor: color + "15" }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

function ApplicationCard({ app, onApprove, onReject, onViewDetail }: {
  app: StoreApplicationReview;
  onApprove: () => void;
  onReject: () => void;
  onViewDetail: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity onPress={onViewDetail} activeOpacity={0.7}>
        <View style={styles.appCardHeader}>
          <View style={styles.appCardLeft}>
            <View style={[styles.appAvatar, { backgroundColor: "#6A1B9A" + "20" }]}>
              <IconSymbol name="storefront.fill" size={20} color="#6A1B9A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.appName, { color: colors.foreground }]}>{app.businessName}</Text>
              <Text style={[styles.appOwner, { color: colors.muted }]}>{app.ownerName}</Text>
            </View>
          </View>
          <StatusBadge status={app.status} />
        </View>

        <View style={styles.appDetails}>
          <View style={styles.appDetailRow}>
            <IconSymbol name="location.fill" size={14} color={colors.muted} />
            <Text style={[styles.appDetailText, { color: colors.muted }]}>
              {app.storeCity}, {app.storeState} {app.storeZip}
            </Text>
          </View>
          <View style={styles.appDetailRow}>
            <IconSymbol name="doc.text.fill" size={14} color={colors.muted} />
            <Text style={[styles.appDetailText, { color: colors.muted }]}>
              {app.licenseType.charAt(0).toUpperCase() + app.licenseType.slice(1)} · {app.licenseNumber}
            </Text>
          </View>
          <View style={styles.appDetailRow}>
            <IconSymbol name="clock.fill" size={14} color={colors.muted} />
            <Text style={[styles.appDetailText, { color: colors.muted }]}>
              Submitted {getTimeAgoAdmin(app.submittedAt)}
            </Text>
          </View>
          <View style={styles.appBadgesRow}>
            {app.supportsExpress && (
              <View style={[styles.featureBadge, { backgroundColor: "#0EA5E9" + "15" }]}>
                <IconSymbol name="bolt.fill" size={12} color="#0EA5E9" />
                <Text style={[styles.featureBadgeText, { color: "#0EA5E9" }]}>Express</Text>
              </View>
            )}
            {app.supportsShipping && (
              <View style={[styles.featureBadge, { backgroundColor: "#8B5CF6" + "15" }]}>
                <IconSymbol name="shippingbox.fill" size={12} color="#8B5CF6" />
                <Text style={[styles.featureBadgeText, { color: "#8B5CF6" }]}>Shipping</Text>
              </View>
            )}
            <View style={[styles.featureBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.featureBadgeText, { color: colors.muted }]}>
                {app.businessType.charAt(0).toUpperCase() + app.businessType.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {app.status === "pending" && (
        <View style={styles.appActions}>
          <TouchableOpacity
            onPress={onApprove}
            style={[styles.actionBtn, { backgroundColor: "#22C55E" }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onReject}
            style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark.circle.fill" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {app.status === "rejected" && app.rejectionReason && (
        <View style={[styles.rejectionNote, { backgroundColor: "#EF4444" + "08", borderColor: "#EF4444" + "20" }]}>
          <Text style={[styles.rejectionLabel, { color: "#EF4444" }]}>Rejection Reason:</Text>
          <Text style={[styles.rejectionText, { color: colors.muted }]}>{app.rejectionReason}</Text>
        </View>
      )}
    </View>
  );
}

export default function StoreApplicationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { storeApplications, approveStoreApp, rejectStoreApp } = useAdmin();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedApp, setSelectedApp] = useState<StoreApplicationReview | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);

  const filteredApps = storeApplications.filter((app) => {
    if (filter === "all") return true;
    if (filter === "pending") return app.status === "pending" || app.status === "under_review";
    return app.status === filter;
  });

  const counts = {
    all: storeApplications.length,
    pending: storeApplications.filter((a) => a.status === "pending" || a.status === "under_review").length,
    approved: storeApplications.filter((a) => a.status === "approved").length,
    rejected: storeApplications.filter((a) => a.status === "rejected").length,
  };

  const handleApprove = (appId: string) => {
    if (Platform.OS === "web") {
      approveStoreApp(appId);
    } else {
      Alert.alert("Approve Application", "Are you sure you want to approve this store application?", [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", onPress: () => approveStoreApp(appId) },
      ]);
    }
  };

  const handleReject = (appId: string) => {
    setRejectingAppId(appId);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (rejectingAppId && rejectionReason.trim()) {
      rejectStoreApp(rejectingAppId, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectingAppId(null);
    }
  };

  // Detail view
  if (showDetail && selectedApp) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDetail(false)} style={styles.backBtn} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Application Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.detailSection}>
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.detailHeader}>
                <View style={[styles.detailAvatar, { backgroundColor: "#6A1B9A" + "20" }]}>
                  <IconSymbol name="storefront.fill" size={28} color="#6A1B9A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailName, { color: colors.foreground }]}>{selectedApp.businessName}</Text>
                  <StatusBadge status={selectedApp.status} />
                </View>
              </View>

              <View style={styles.detailGroup}>
                <Text style={[styles.detailGroupTitle, { color: colors.foreground }]}>Owner Information</Text>
                <DetailRow label="Name" value={selectedApp.ownerName} colors={colors} />
                <DetailRow label="Email" value={selectedApp.ownerEmail} colors={colors} />
                <DetailRow label="Phone" value={selectedApp.ownerPhone} colors={colors} />
              </View>

              <View style={styles.detailGroup}>
                <Text style={[styles.detailGroupTitle, { color: colors.foreground }]}>Store Details</Text>
                <DetailRow label="Address" value={selectedApp.storeAddress} colors={colors} />
                <DetailRow label="City" value={`${selectedApp.storeCity}, ${selectedApp.storeState} ${selectedApp.storeZip}`} colors={colors} />
                <DetailRow label="Type" value={selectedApp.businessType.charAt(0).toUpperCase() + selectedApp.businessType.slice(1)} colors={colors} />
              </View>

              <View style={styles.detailGroup}>
                <Text style={[styles.detailGroupTitle, { color: colors.foreground }]}>Licensing</Text>
                <DetailRow label="Type" value={selectedApp.licenseType.charAt(0).toUpperCase() + selectedApp.licenseType.slice(1)} colors={colors} />
                <DetailRow label="Number" value={selectedApp.licenseNumber} colors={colors} />
                <DetailRow label="Expiry" value={new Date(selectedApp.licenseExpiry).toLocaleDateString()} colors={colors} />
              </View>

              <View style={styles.detailGroup}>
                <Text style={[styles.detailGroupTitle, { color: colors.foreground }]}>Capabilities</Text>
                <DetailRow label="Express Delivery" value={selectedApp.supportsExpress ? "Yes" : "No"} colors={colors} />
                <DetailRow label="Shipping" value={selectedApp.supportsShipping ? "Yes" : "No"} colors={colors} />
              </View>

              {selectedApp.status === "pending" && (
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    onPress={() => { handleApprove(selectedApp.id); setShowDetail(false); }}
                    style={[styles.detailActionBtn, { backgroundColor: "#22C55E" }]}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />
                    <Text style={styles.detailActionBtnText}>Approve Application</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { handleReject(selectedApp.id); setShowDetail(false); }}
                    style={[styles.detailActionBtn, { backgroundColor: "#EF4444" }]}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="xmark.circle.fill" size={18} color="#fff" />
                    <Text style={styles.detailActionBtnText}>Reject Application</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Store Applications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "pending", "approved", "rejected"] as FilterTab[]).map((tab) => (
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {filteredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="storefront.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No applications found</Text>
          </View>
        ) : (
          filteredApps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={() => handleApprove(app.id)}
              onReject={() => handleReject(app.id)}
              onViewDetail={() => { setSelectedApp(app); setShowDetail(true); }}
            />
          ))
        )}
      </ScrollView>

      {/* Rejection Modal */}
      {showRejectModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Reject Application</Text>
            <Text style={[styles.modalSub, { color: colors.muted }]}>Please provide a reason for rejection:</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setShowRejectModal(false); setRejectionReason(""); }}
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmReject}
                style={[styles.modalBtn, { backgroundColor: "#EF4444", opacity: rejectionReason.trim() ? 1 : 0.5 }]}
                activeOpacity={0.7}
                disabled={!rejectionReason.trim()}
              >
                <Text style={styles.modalBtnTextWhite}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
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

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  filterTabText: { fontSize: 12, fontWeight: "600" },
  // Card
  appCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  appCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  appCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  appAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 15, fontWeight: "700" },
  appOwner: { fontSize: 12, marginTop: 1 },
  appDetails: { gap: 6 },
  appDetailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  appDetailText: { fontSize: 12 },
  appBadgesRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  featureBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featureBadgeText: { fontSize: 10, fontWeight: "600" },
  // Status
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  // Actions
  appActions: { flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  // Rejection
  rejectionNote: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  rejectionLabel: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  rejectionText: { fontSize: 12 },
  // Empty
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  // Detail
  detailSection: { padding: 16 },
  detailCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  detailAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  detailName: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  detailGroup: { marginBottom: 16 },
  detailGroupTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  detailActions: { gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  detailActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  detailActionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
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
