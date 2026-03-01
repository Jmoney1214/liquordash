import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAdmin, PlatformSettings } from "@/lib/admin-store";

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
        {description && <Text style={[styles.settingDesc, { color: colors.muted }]}>{description}</Text>}
      </View>
      {children}
    </View>
  );
}

function NumberInput({ value, onChange, prefix, suffix }: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string;
}) {
  const colors = useColors();
  const [text, setText] = useState(value.toString());

  const handleBlur = () => {
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    } else {
      setText(value.toString());
    }
  };

  return (
    <View style={styles.numberInputWrap}>
      {prefix && <Text style={[styles.inputPrefix, { color: colors.muted }]}>{prefix}</Text>}
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        returnKeyType="done"
        style={[styles.numberInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
      />
      {suffix && <Text style={[styles.inputSuffix, { color: colors.muted }]}>{suffix}</Text>}
    </View>
  );
}

export default function AdminSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { settings, updateSettings, adminUser } = useAdmin();
  const [saved, setSaved] = useState(false);

  const handleUpdate = (partial: Partial<PlatformSettings>) => {
    updateSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Platform Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {saved && (
        <View style={[styles.savedBanner, { backgroundColor: "#22C55E" + "15" }]}>
          <IconSymbol name="checkmark.circle.fill" size={16} color="#22C55E" />
          <Text style={[styles.savedText, { color: "#22C55E" }]}>Settings saved</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Admin Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Admin Account</Text>
          <View style={[styles.adminCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.adminAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.adminInitials, { color: colors.primary }]}>{adminUser.avatarInitials}</Text>
            </View>
            <View>
              <Text style={[styles.adminName, { color: colors.foreground }]}>{adminUser.name}</Text>
              <Text style={[styles.adminEmail, { color: colors.muted }]}>{adminUser.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.roleText, { color: colors.primary }]}>
                  {adminUser.role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Commission & Fees */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Commission & Fees</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow label="Commission Rate" description="Platform commission on each order">
              <NumberInput value={settings.commissionRate} onChange={(v) => handleUpdate({ commissionRate: v })} suffix="%" />
            </SettingRow>
            <SettingRow label="Express Delivery Fee" description="Fee charged for express delivery">
              <NumberInput value={settings.expressDeliveryFee} onChange={(v) => handleUpdate({ expressDeliveryFee: v })} prefix="$" />
            </SettingRow>
            <SettingRow label="Shipping Fee" description="Fee charged for nationwide shipping">
              <NumberInput value={settings.shippingFee} onChange={(v) => handleUpdate({ shippingFee: v })} prefix="$" />
            </SettingRow>
            <SettingRow label="Minimum Order" description="Minimum order amount required">
              <NumberInput value={settings.minimumOrderAmount} onChange={(v) => handleUpdate({ minimumOrderAmount: v })} prefix="$" />
            </SettingRow>
          </View>
        </View>

        {/* Driver Pay */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Driver Compensation</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow label="Base Pay" description="Base pay per delivery">
              <NumberInput value={settings.driverBasePay} onChange={(v) => handleUpdate({ driverBasePay: v })} prefix="$" />
            </SettingRow>
            <SettingRow label="Per Mile Pay" description="Additional pay per mile driven">
              <NumberInput value={settings.driverPerMilePay} onChange={(v) => handleUpdate({ driverPerMilePay: v })} prefix="$" />
            </SettingRow>
          </View>
        </View>

        {/* Feature Toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Features</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow label="Promo Codes" description="Enable promotional discount codes">
              <Switch
                value={settings.promoCodeEnabled}
                onValueChange={(v) => handleUpdate({ promoCodeEnabled: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === "android" ? "#fff" : undefined}
              />
            </SettingRow>
            <SettingRow label="Maintenance Mode" description="Temporarily disable the platform">
              <Switch
                value={settings.maintenanceMode}
                onValueChange={(v) => handleUpdate({ maintenanceMode: v })}
                trackColor={{ false: colors.border, true: "#EF4444" }}
                thumbColor={Platform.OS === "android" ? "#fff" : undefined}
              />
            </SettingRow>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Danger Zone</Text>
          <View style={[styles.settingsCard, { backgroundColor: "#EF4444" + "05", borderColor: "#EF4444" + "20" }]}>
            <SettingRow label="Maintenance Mode" description="When enabled, all customers see a maintenance page">
              <View style={[styles.dangerIndicator, { backgroundColor: settings.maintenanceMode ? "#EF4444" + "15" : "#22C55E" + "15" }]}>
                <View style={[styles.dangerDot, { backgroundColor: settings.maintenanceMode ? "#EF4444" : "#22C55E" }]} />
                <Text style={[styles.dangerText, { color: settings.maintenanceMode ? "#EF4444" : "#22C55E" }]}>
                  {settings.maintenanceMode ? "Active" : "Inactive"}
                </Text>
              </View>
            </SettingRow>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center" },
  savedBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, marginHorizontal: 16, borderRadius: 10, marginBottom: 8 },
  savedText: { fontSize: 13, fontWeight: "600" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  // Admin Card
  adminCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  adminAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  adminInitials: { fontSize: 18, fontWeight: "700" },
  adminName: { fontSize: 16, fontWeight: "700" },
  adminEmail: { fontSize: 12, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },
  roleText: { fontSize: 10, fontWeight: "700" },
  // Settings Card
  settingsCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 1 },
  settingLabel: { fontSize: 14, fontWeight: "600" },
  settingDesc: { fontSize: 11, marginTop: 2 },
  // Number Input
  numberInputWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  numberInput: { width: 70, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14, fontWeight: "600", textAlign: "center" },
  inputPrefix: { fontSize: 14, fontWeight: "600" },
  inputSuffix: { fontSize: 14, fontWeight: "600" },
  // Danger
  dangerIndicator: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dangerDot: { width: 8, height: 8, borderRadius: 4 },
  dangerText: { fontSize: 12, fontWeight: "600" },
});
