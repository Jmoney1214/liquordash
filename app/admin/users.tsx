import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAdmin, PlatformUser, formatAdminCurrency } from "@/lib/admin-store";

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#9CA3AF",
  gold: "#F59E0B",
  platinum: "#6366F1",
};

type FilterTab = "all" | "active" | "suspended";

function UserCard({ user, onSuspend, onActivate }: {
  user: PlatformUser;
  onSuspend: () => void;
  onActivate: () => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const tierColor = TIER_COLORS[user.rewardsTier];
  const statusColor = user.status === "active" ? "#22C55E" : user.status === "suspended" ? "#EF4444" : "#6B7280";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: tierColor + "20" }]}>
            <Text style={[styles.avatarText, { color: tierColor }]}>
              {user.name.split(" ").map((n) => n[0]).join("")}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
              {user.isVerified && (
                <IconSymbol name="checkmark.circle.fill" size={14} color="#22C55E" />
              )}
            </View>
            <Text style={[styles.userEmail, { color: colors.muted }]}>{user.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.userStats}>
          <View style={[styles.userStatItem, { backgroundColor: colors.border + "50" }]}>
            <Text style={[styles.userStatValue, { color: colors.foreground }]}>{user.totalOrders}</Text>
            <Text style={[styles.userStatLabel, { color: colors.muted }]}>Orders</Text>
          </View>
          <View style={[styles.userStatItem, { backgroundColor: colors.border + "50" }]}>
            <Text style={[styles.userStatValue, { color: colors.foreground }]}>{formatAdminCurrency(user.totalSpent)}</Text>
            <Text style={[styles.userStatLabel, { color: colors.muted }]}>Spent</Text>
          </View>
          <View style={[styles.userStatItem, { backgroundColor: tierColor + "10" }]}>
            <Text style={[styles.userStatValue, { color: tierColor }]}>
              {user.rewardsTier.charAt(0).toUpperCase() + user.rewardsTier.slice(1)}
            </Text>
            <Text style={[styles.userStatLabel, { color: colors.muted }]}>Tier</Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandedSection, { borderColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Phone</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{user.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Joined</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Verified</Text>
            <Text style={[styles.detailValue, { color: user.isVerified ? "#22C55E" : "#EF4444" }]}>
              {user.isVerified ? "Yes" : "No"}
            </Text>
          </View>

          {user.status === "active" && (
            <TouchableOpacity onPress={onSuspend} style={[styles.expandedAction, { backgroundColor: "#EF4444" }]} activeOpacity={0.7}>
              <IconSymbol name="nosign" size={14} color="#fff" />
              <Text style={styles.expandedActionText}>Suspend User</Text>
            </TouchableOpacity>
          )}
          {user.status === "suspended" && (
            <TouchableOpacity onPress={onActivate} style={[styles.expandedAction, { backgroundColor: "#22C55E" }]} activeOpacity={0.7}>
              <IconSymbol name="arrow.clockwise" size={14} color="#fff" />
              <Text style={styles.expandedActionText}>Reactivate User</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function UsersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { platformUsers, suspendUser, activateUser } = useAdmin();
  const [filter, setFilter] = useState<FilterTab>("all");

  const filteredUsers = platformUsers.filter((u) => {
    if (filter === "all") return true;
    return u.status === filter;
  });

  const counts = {
    all: platformUsers.length,
    active: platformUsers.filter((u) => u.status === "active").length,
    suspended: platformUsers.filter((u) => u.status === "suspended" || u.status === "deactivated").length,
  };

  const totalSpent = platformUsers.reduce((s, u) => s + u.totalSpent, 0);
  const totalOrders = platformUsers.reduce((s, u) => s + u.totalOrders, 0);

  const handleSuspend = (id: string) => {
    if (Platform.OS === "web") {
      suspendUser(id);
    } else {
      Alert.alert("Suspend User", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Suspend", style: "destructive", onPress: () => suspendUser(id) },
      ]);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#8B5CF6" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#8B5CF6" }]}>{counts.all}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#22C55E" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{formatAdminCurrency(totalSpent)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Spent</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#3B82F6" + "10" }]}>
          <Text style={[styles.summaryValue, { color: "#3B82F6" }]}>{totalOrders}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Orders</Text>
        </View>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["all", "active", "suspended"] as FilterTab[]).map((tab) => (
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
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.2.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onSuspend={() => handleSuspend(u.id)}
              onActivate={() => activateUser(u.id)}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  summaryValue: { fontSize: 14, fontWeight: "800" },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  filterTabText: { fontSize: 12, fontWeight: "600" },
  // Card
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  userName: { fontSize: 15, fontWeight: "700" },
  userEmail: { fontSize: 12, marginTop: 1 },
  userStats: { flexDirection: "row", gap: 8, marginTop: 10 },
  userStatItem: { flex: 1, padding: 8, borderRadius: 8, alignItems: "center" },
  userStatValue: { fontSize: 13, fontWeight: "700" },
  userStatLabel: { fontSize: 10, marginTop: 1 },
  // Status
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  // Expanded
  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: "600" },
  expandedAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  expandedActionText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  // Empty
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600" },
});
