import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFavorites } from "@/lib/favorites-store";
import { useOrders } from "@/lib/orders-store";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  color,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { borderColor: colors.border }]}
      activeOpacity={0.6}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: (color || colors.primary) + "15" }]}>
        <IconSymbol name={icon} size={20} color={color || colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={[styles.menuValue, { color: colors.muted }]}>{value}</Text>}
        {showArrow && <IconSymbol name="chevron.right" size={16} color={colors.muted} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { favorites } = useFavorites();
  const { orders } = useOrders();

  const showComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is coming in a future update.");
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>G</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>Guest User</Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>Sign in for full experience</Text>
          </View>
          <TouchableOpacity
            onPress={showComingSoon}
            style={[styles.editBtn, { borderColor: colors.border }]}
            activeOpacity={0.6}
          >
            <Text style={[styles.editBtnText, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Age Verification */}
        <View style={[styles.verifyCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
          <IconSymbol name="person.badge.shield.checkmark.fill" size={24} color={colors.success} />
          <View style={styles.verifyInfo}>
            <Text style={[styles.verifyTitle, { color: colors.success }]}>Age Verified</Text>
            <Text style={[styles.verifySubtitle, { color: colors.muted }]}>You are verified as 21+</Text>
          </View>
          <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{orders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{favorites.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Favorites</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>$0</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Credits</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Account</Text>
          <MenuItem icon="location.fill" label="Saved Addresses" onPress={showComingSoon} />
          <MenuItem icon="creditcard.fill" label="Payment Methods" onPress={showComingSoon} />
          <MenuItem icon="heart.fill" label="Favorites" value={`${favorites.length}`} onPress={showComingSoon} color={colors.error} />
          <MenuItem icon="gift.fill" label="Gift Cards & Credits" onPress={showComingSoon} color={colors.warning} />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Preferences</Text>
          <MenuItem icon="bell.fill" label="Notifications" onPress={showComingSoon} />
          <MenuItem icon="gearshape.fill" label="Settings" onPress={showComingSoon} />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Support</Text>
          <MenuItem icon="questionmark.circle.fill" label="Help & Support" onPress={showComingSoon} />
          <MenuItem icon="doc.text.fill" label="Terms & Privacy" onPress={showComingSoon} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>LiquorDash v1.0.0</Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>Must be 21+ to use this app</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  verifyCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  verifyInfo: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  verifySubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menuValue: {
    fontSize: 13,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
