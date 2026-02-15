import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer, NotificationPreferences } from "@/lib/customer-store";

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderColor: colors.border }]}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: colors.muted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "60" }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { notifications, updateNotifications } = useCustomer();

  const toggle = (key: keyof NotificationPreferences) => {
    updateNotifications({ [key]: !notifications[key] });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Channels */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Channels</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ToggleRow
              label="Push Notifications"
              description="Receive alerts on your device"
              value={notifications.pushEnabled}
              onToggle={() => toggle("pushEnabled")}
            />
            <ToggleRow
              label="Email Notifications"
              description="Receive updates via email"
              value={notifications.emailEnabled}
              onToggle={() => toggle("emailEnabled")}
            />
            <ToggleRow
              label="SMS Notifications"
              description="Receive text message alerts"
              value={notifications.smsEnabled}
              onToggle={() => toggle("smsEnabled")}
            />
          </View>
        </View>

        {/* Alert Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Alert Types</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ToggleRow
              label="Order Updates"
              description="Status changes, confirmations, delivery"
              value={notifications.orderUpdates}
              onToggle={() => toggle("orderUpdates")}
            />
            <ToggleRow
              label="Delivery Alerts"
              description="Driver en route, arrival notifications"
              value={notifications.deliveryAlerts}
              onToggle={() => toggle("deliveryAlerts")}
            />
            <ToggleRow
              label="Rewards Alerts"
              description="Points earned, tier upgrades, expiring points"
              value={notifications.rewardsAlerts}
              onToggle={() => toggle("rewardsAlerts")}
            />
            <ToggleRow
              label="Promotions"
              description="Sales, discounts, and special offers"
              value={notifications.promotions}
              onToggle={() => toggle("promotions")}
            />
            <ToggleRow
              label="New Arrivals"
              description="New products and restocks"
              value={notifications.newArrivals}
              onToggle={() => toggle("newArrivals")}
            />
            <ToggleRow
              label="Price Drops"
              description="Price reductions on favorites"
              value={notifications.priceDrops}
              onToggle={() => toggle("priceDrops")}
            />
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            You can change these settings at any time. Critical order and safety notifications cannot be disabled.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { paddingBottom: 40 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5 },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginHorizontal: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
