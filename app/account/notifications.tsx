import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer, type NotificationPreferences } from "@/lib/customer-store";
import { useNotificationContext } from "@/lib/notification-provider";
// notifications.ts uses expo-notifications which is native-only
const sendLocalNotification = Platform.OS !== "web"
  ? require("@/lib/notifications").sendLocalNotification
  : async () => { throw new Error("Not available on web"); };
const NOTIFICATION_CHANNELS = Platform.OS !== "web"
  ? require("@/lib/notifications").NOTIFICATION_CHANNELS
  : { ORDERS: "orders", DELIVERY: "delivery", PROMOTIONS: "promotions", STORE_ALERTS: "store_alerts", DRIVER_ALERTS: "driver_alerts", ADMIN_ALERTS: "admin_alerts" };

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, value, onToggle, disabled }: ToggleRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: colors.muted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
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
  const { permissionGranted, pushToken, requestPermission, unreadCount, clearAll } = useNotificationContext();
  const [testSending, setTestSending] = useState(false);

  const toggle = (key: keyof NotificationPreferences) => {
    updateNotifications({ [key]: !notifications[key] });
  };

  const handleEnablePush = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        "Permission Required",
        "Push notifications are disabled. Please enable them in your device Settings.",
        [{ text: "OK" }],
      );
    }
  };

  const handleTestNotification = async () => {
    setTestSending(true);
    try {
      await sendLocalNotification({
        title: "Test Notification",
        body: "Push notifications are working! You'll receive order updates, delivery alerts, and more.",
        data: { type: "test", url: "/account/notifications" },
        channelId: NOTIFICATION_CHANNELS.ORDERS,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to send test notification.");
    } finally {
      setTestSending(false);
    }
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
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>System Status</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statusRow, { borderColor: colors.border }]}>
              <View style={styles.statusInfo}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusDot, { backgroundColor: permissionGranted ? colors.success : colors.error }]} />
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                    Push Notifications
                  </Text>
                </View>
                <Text style={[styles.toggleDesc, { color: colors.muted }]}>
                  {permissionGranted
                    ? "Enabled — you'll receive alerts on this device"
                    : "Disabled — tap to enable push notifications"}
                </Text>
              </View>
              {!permissionGranted && (
                <TouchableOpacity
                  onPress={handleEnablePush}
                  activeOpacity={0.7}
                  style={[styles.enableBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.enableBtnText, { color: "#fff" }]}>Enable</Text>
                </TouchableOpacity>
              )}
            </View>

            {permissionGranted && pushToken && (
              <View style={[styles.tokenRow, { borderColor: colors.border }]}>
                <Text style={[styles.toggleDesc, { color: colors.muted }]}>
                  Push Token: {pushToken.slice(0, 24)}...
                </Text>
              </View>
            )}

            {unreadCount > 0 && (
              <View style={[styles.statusRow, { borderColor: colors.border }]}>
                <View style={styles.statusInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                    {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearAll}
                  activeOpacity={0.7}
                  style={[styles.clearBtn, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Test Notification */}
        {permissionGranted && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={handleTestNotification}
              disabled={testSending}
              activeOpacity={0.7}
              style={[styles.testBtn, { backgroundColor: colors.primary, opacity: testSending ? 0.6 : 1 }]}
            >
              <IconSymbol name="bell.fill" size={18} color="#fff" />
              <Text style={styles.testBtnText}>
                {testSending ? "Sending..." : "Send Test Notification"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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

        {/* Notification Channels Info (Android) */}
        {Platform.OS === "android" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Android Channels</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                { name: "Order Updates", desc: "High priority — status changes" },
                { name: "Delivery Alerts", desc: "High priority — driver en route" },
                { name: "Promotions & Deals", desc: "Default priority — sales & offers" },
                { name: "Store Partner Alerts", desc: "Max priority — new orders" },
                { name: "Driver Alerts", desc: "Max priority — delivery jobs" },
                { name: "Admin Alerts", desc: "High priority — platform alerts" },
              ].map((ch, i) => (
                <View key={i} style={[styles.channelRow, { borderColor: colors.border }]}>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{ch.name}</Text>
                  <Text style={[styles.toggleDesc, { color: colors.muted }]}>{ch.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Critical order and safety notifications cannot be disabled. Push notifications are delivered via Expo Push Service and work on both iOS and Android devices.
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
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5 },
  statusInfo: { flex: 1, marginRight: 12 },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tokenRow: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 0.5 },
  enableBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  enableBtnText: { fontSize: 14, fontWeight: "600" },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  clearBtnText: { fontSize: 13, fontWeight: "600" },
  testBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  testBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  channelRow: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginHorizontal: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
