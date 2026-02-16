import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDriver, VEHICLE_TYPES, formatCurrency } from "@/lib/driver-store";

export default function DriverProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, earningsSummary, updateProfile } = useDriver();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    vehicleMake: profile.vehicleMake,
    vehicleModel: profile.vehicleModel,
    vehicleColor: profile.vehicleColor,
    licensePlate: profile.licensePlate,
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
    Alert.alert("Saved", "Your profile has been updated.");
  };

  const vehicleType = VEHICLE_TYPES.find((v) => v.value === profile.vehicleType);

  const renderField = (label: string, key: string, value: string) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={(form as any)[key]}
          onChangeText={(v) => update(key, v)}
          autoCapitalize="none"
        />
      ) : (
        <Text style={[styles.fieldValue, { color: colors.foreground }]}>{value || "Not set"}</Text>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Driver Profile</Text>
          <TouchableOpacity onPress={editing ? handleSave : () => setEditing(true)} activeOpacity={0.6}>
            <Text style={[styles.editBtn, { color: "#1B6B3A" }]}>{editing ? "Save" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: "#1B6B3A" }]}>
            <View style={styles.avatarLg}>
              <Text style={styles.avatarLgText}>{profile.avatarInitials || "D"}</Text>
            </View>
            <Text style={styles.profileName}>{profile.firstName} {profile.lastName}</Text>
            <Text style={styles.profileId}>Driver ID: {profile.id}</Text>

            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile.totalDeliveries}</Text>
                <Text style={styles.profileStatLabel}>Deliveries</Text>
              </View>
              <View style={[styles.profileStatDivider]} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>★ {profile.rating.toFixed(1)}</Text>
                <Text style={styles.profileStatLabel}>Rating</Text>
              </View>
              <View style={[styles.profileStatDivider]} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{formatCurrency(earningsSummary.totalEarnings)}</Text>
                <Text style={styles.profileStatLabel}>Total Earned</Text>
              </View>
            </View>

            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol name="checkmark.seal.fill" size={14} color="#4ADE80" />
                <Text style={styles.verifiedText}>Verified Driver</Text>
              </View>
            )}
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Information</Text>
            {renderField("First Name", "firstName", profile.firstName)}
            {renderField("Last Name", "lastName", profile.lastName)}
            {renderField("Email", "email", profile.email)}
            {renderField("Phone", "phone", profile.phone)}
          </View>

          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vehicle</Text>
            <View style={[styles.vehicleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.vehicleEmoji}>{vehicleType?.icon || "🚗"}</Text>
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleType, { color: colors.foreground }]}>{vehicleType?.label || "Car"}</Text>
                <Text style={[styles.vehicleDetails, { color: colors.muted }]}>
                  {profile.vehicleColor} {profile.vehicleMake} {profile.vehicleModel}
                </Text>
                <Text style={[styles.vehiclePlate, { color: colors.muted }]}>Plate: {profile.licensePlate}</Text>
              </View>
            </View>
            {editing && (
              <>
                {renderField("Make", "vehicleMake", profile.vehicleMake)}
                {renderField("Model", "vehicleModel", profile.vehicleModel)}
                {renderField("Color", "vehicleColor", profile.vehicleColor)}
                {renderField("License Plate", "licensePlate", profile.licensePlate)}
              </>
            )}
          </View>

          {/* Documents */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents</Text>
            <View style={[styles.docRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={20} color="#1B6B3A" />
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: colors.foreground }]}>Driver's License</Text>
                <Text style={[styles.docValue, { color: colors.muted }]}>{profile.driversLicense || "Not provided"}</Text>
              </View>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#22C55E" />
            </View>
            <View style={[styles.docRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="shield.fill" size={20} color="#3B82F6" />
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: colors.foreground }]}>Insurance</Text>
                <Text style={[styles.docValue, { color: colors.muted }]}>{profile.insuranceNumber || "Not provided"}</Text>
              </View>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#22C55E" />
            </View>
          </View>

          {/* Member Since */}
          <View style={styles.section}>
            <View style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="calendar" size={20} color={colors.muted} />
              <Text style={[styles.memberText, { color: colors.muted }]}>
                Member since {new Date(profile.memberSince).toLocaleDateString([], { month: "long", year: "numeric" })}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  editBtn: { fontSize: 15, fontWeight: "700" },
  profileCard: { marginHorizontal: 16, padding: 20, borderRadius: 16, alignItems: "center" },
  avatarLg: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarLgText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  profileName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  profileId: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  profileStats: { flexDirection: "row", marginTop: 16, gap: 16 },
  profileStat: { alignItems: "center" },
  profileStatValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  profileStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  profileStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { color: "#4ADE80", fontSize: 12, fontWeight: "600" },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  fieldInput: { fontSize: 16, fontWeight: "500", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  fieldValue: { fontSize: 16, fontWeight: "500" },
  vehicleCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  vehicleEmoji: { fontSize: 32 },
  vehicleInfo: { flex: 1 },
  vehicleType: { fontSize: 16, fontWeight: "700" },
  vehicleDetails: { fontSize: 13, marginTop: 2 },
  vehiclePlate: { fontSize: 12, marginTop: 1 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: "600" },
  docValue: { fontSize: 12, marginTop: 1 },
  memberCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  memberText: { fontSize: 13 },
});
