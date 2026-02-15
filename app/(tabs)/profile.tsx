import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFavorites } from "@/lib/favorites-store";
import { useOrders } from "@/lib/orders-store";
import { useStore } from "@/lib/store-context";
import { useCustomer, TIER_COLORS } from "@/lib/customer-store";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  color,
  badge,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
  badge?: string;
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
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
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
  const { orders, activeOrders } = useOrders();
  const { isOnboarded, storeProfile, setMode } = useStore();
  const { profile, rewards, addresses, paymentMethods, notifications } = useCustomer();

  const tierColor = TIER_COLORS[rewards.tier];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* User Card */}
        <TouchableOpacity
          onPress={() => router.push("/account/edit-profile" as any)}
          style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{profile.avatarInitials || "G"}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>
              {profile.email || "Tap to edit profile"}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </TouchableOpacity>

        {/* Rewards Banner */}
        <TouchableOpacity
          onPress={() => router.push("/account/rewards" as any)}
          style={[styles.rewardsBanner, { backgroundColor: tierColor }]}
          activeOpacity={0.7}
        >
          <View style={styles.rewardsLeft}>
            <Text style={styles.rewardsTier}>{rewards.tier.toUpperCase()} MEMBER</Text>
            <Text style={styles.rewardsPoints}>{rewards.points.toLocaleString()} pts</Text>
            <Text style={styles.rewardsValue}>
              Worth ${(rewards.points / 100 * 5).toFixed(2)}
            </Text>
          </View>
          <View style={styles.rewardsRight}>
            <IconSymbol name="star.fill" size={32} color="rgba(255,255,255,0.3)" />
            <Text style={styles.rewardsAction}>View Rewards</Text>
          </View>
        </TouchableOpacity>

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
          <TouchableOpacity
            onPress={() => router.push("/account/order-history" as any)}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{orders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Orders</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{favorites.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Favorites</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: tierColor }]}>{rewards.points}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Points</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Account</Text>
          <MenuItem
            icon="person.fill"
            label="Edit Profile"
            onPress={() => router.push("/account/edit-profile" as any)}
          />
          <MenuItem
            icon="location.fill"
            label="Saved Addresses"
            value={addresses.length > 0 ? `${addresses.length} saved` : undefined}
            onPress={() => router.push("/account/addresses" as any)}
          />
          <MenuItem
            icon="creditcard.fill"
            label="Payment Methods"
            value={paymentMethods.length > 0 ? `${paymentMethods.length} cards` : undefined}
            onPress={() => router.push("/account/payments" as any)}
          />
          <MenuItem
            icon="bag.fill"
            label="Order History"
            value={`${orders.length} orders`}
            badge={activeOrders.length > 0 ? `${activeOrders.length}` : undefined}
            onPress={() => router.push("/account/order-history" as any)}
          />
          <MenuItem
            icon="heart.fill"
            label="Favorites"
            value={`${favorites.length}`}
            color={colors.error}
          />
          <MenuItem
            icon="star.fill"
            label="Rewards & Points"
            value={`${rewards.points} pts`}
            onPress={() => router.push("/account/rewards" as any)}
            color={tierColor}
          />
        </View>

        {/* Preferences */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Preferences</Text>
          <MenuItem
            icon="bell.fill"
            label="Notifications"
            value={notifications.pushEnabled ? "On" : "Off"}
            onPress={() => router.push("/account/notifications" as any)}
          />
          <MenuItem icon="gearshape.fill" label="Settings" />
        </View>

        {/* Store Partner Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Store Partner</Text>
          {isOnboarded ? (
            <>
              <MenuItem
                icon="storefront.fill"
                label="Store Dashboard"
                value={storeProfile?.name}
                onPress={() => {
                  setMode("store");
                  router.push("/store/dashboard" as any);
                }}
                color="#6A1B9A"
              />
              <MenuItem
                icon="list.bullet"
                label="Manage Orders"
                onPress={() => router.push("/store/orders" as any)}
                color="#6A1B9A"
              />
              <MenuItem
                icon="tray.full.fill"
                label="Manage Inventory"
                onPress={() => router.push("/store/inventory" as any)}
                color="#6A1B9A"
              />
            </>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/store/onboarding" as any)}
              style={[styles.partnerCta, { backgroundColor: "#6A1B9A" }]}
              activeOpacity={0.7}
            >
              <View style={styles.partnerCtaLeft}>
                <IconSymbol name="storefront.fill" size={24} color="#fff" />
                <View>
                  <Text style={styles.partnerCtaTitle}>Become a Partner Store</Text>
                  <Text style={styles.partnerCtaSubtitle}>List your store and start fulfilling orders</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Support */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>Support</Text>
          <MenuItem
            icon="questionmark.circle.fill"
            label="Help & Support"
            onPress={() => router.push("/account/support" as any)}
          />
          <MenuItem icon="doc.text.fill" label="Terms & Privacy" />
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
  rewardsBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  rewardsLeft: {},
  rewardsTier: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  rewardsPoints: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  rewardsValue: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  rewardsRight: {
    alignItems: "center",
    gap: 4,
  },
  rewardsAction: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
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
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
  partnerCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  partnerCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  partnerCtaTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  partnerCtaSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
  },
});
