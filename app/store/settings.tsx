import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  color,
  destructive,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
  destructive?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      activeOpacity={0.6}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: (destructive ? colors.error : color || colors.primary) + "15" },
        ]}
      >
        <IconSymbol
          name={icon}
          size={18}
          color={destructive ? colors.error : color || colors.primary}
        />
      </View>
      <Text
        style={[
          styles.settingLabel,
          { color: destructive ? colors.error : colors.foreground },
        ]}
      >
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.muted }]}>{value}</Text>}
        {showArrow && <IconSymbol name="chevron.right" size={16} color={colors.muted} />}
      </View>
    </TouchableOpacity>
  );
}

export default function StoreSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { storeProfile, setMode } = useStore();

  const showComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is coming in a future update.");
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Store",
      "This will temporarily pause your store from receiving new orders. You can reactivate anytime.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: showComingSoon },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Store Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Store Information</Text>
          <SettingRow
            icon="storefront.fill"
            label="Store Profile"
            value={storeProfile?.name}
            onPress={showComingSoon}
          />
          <SettingRow
            icon="location.fill"
            label="Store Address"
            value={storeProfile?.city ? `${storeProfile.city}, ${storeProfile.state}` : ""}
            onPress={showComingSoon}
          />
          <SettingRow icon="phone.fill" label="Contact Info" onPress={showComingSoon} />
          <SettingRow icon="photo.fill" label="Store Photos" onPress={showComingSoon} />
        </View>

        {/* Operations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Operations</Text>
          <SettingRow icon="clock.fill" label="Operating Hours" onPress={showComingSoon} />
          <SettingRow
            icon="bolt.fill"
            label="Express Delivery Zone"
            value={storeProfile?.expressDeliveryRadius ? `${storeProfile.expressDeliveryRadius} mi` : ""}
            onPress={showComingSoon}
            color={colors.success}
          />
          <SettingRow
            icon="shippingbox.fill"
            label="Shipping Settings"
            onPress={showComingSoon}
          />
          <SettingRow
            icon="person.2.fill"
            label="Staff Accounts"
            value="1 member"
            onPress={showComingSoon}
          />
        </View>

        {/* Payments */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Payments & Payouts</Text>
          <SettingRow
            icon="banknote.fill"
            label="Payout Account"
            onPress={showComingSoon}
            color={colors.success}
          />
          <SettingRow
            icon="dollarsign.circle.fill"
            label="Commission Rate"
            value="15%"
            showArrow={false}
          />
          <SettingRow
            icon="calendar"
            label="Payout Schedule"
            value="Weekly"
            onPress={showComingSoon}
          />
          <SettingRow
            icon="doc.text.fill"
            label="Tax Documents"
            onPress={showComingSoon}
          />
        </View>

        {/* Compliance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Compliance</Text>
          <SettingRow
            icon="checkmark.seal.fill"
            label="License Information"
            onPress={showComingSoon}
            color={colors.success}
          />
          <SettingRow
            icon="person.badge.shield.checkmark.fill"
            label="Age Verification Settings"
            onPress={showComingSoon}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Notifications</Text>
          <SettingRow icon="bell.fill" label="Order Alerts" onPress={showComingSoon} />
          <SettingRow icon="envelope.fill" label="Email Notifications" onPress={showComingSoon} />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Support</Text>
          <SettingRow icon="questionmark.circle.fill" label="Help Center" onPress={showComingSoon} />
          <SettingRow icon="phone.fill" label="Contact Support" onPress={showComingSoon} />
          <SettingRow icon="doc.text.fill" label="Partner Agreement" onPress={showComingSoon} />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <SettingRow
            icon="exclamationmark.triangle.fill"
            label="Deactivate Store"
            onPress={handleDeactivate}
            showArrow={false}
            destructive
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            LiquorDash Partner v1.0.0
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValue: {
    fontSize: 13,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
  },
});
