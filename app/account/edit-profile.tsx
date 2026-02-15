import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer } from "@/lib/customer-store";

export default function EditProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, updateProfile } = useCustomer();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [dob, setDob] = useState(profile.dateOfBirth);

  const handleSave = () => {
    if (!firstName.trim()) {
      Alert.alert("Error", "First name is required.");
      return;
    }
    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dateOfBirth: dob.trim(),
    });
    Alert.alert("Saved", "Your profile has been updated.", [{ text: "OK", onPress: () => router.back() }]);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.6}>
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {(firstName[0] || "").toUpperCase()}{(lastName[0] || "").toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.avatarHint, { color: colors.muted }]}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Personal Information</Text>

            <View style={[styles.inputGroup, { borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>First Name</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Phone</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Date of Birth</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={dob}
                onChangeText={setDob}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Age Verification Status */}
          <View style={[styles.verifyBanner, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
            <IconSymbol name="checkmark.seal.fill" size={20} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyText, { color: colors.success }]}>Age Verified (21+)</Text>
              <Text style={[styles.verifySubtext, { color: colors.muted }]}>Verified on {new Date(profile.memberSince).toLocaleDateString()}</Text>
            </View>
          </View>

          {/* Member Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Member Since</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{new Date(profile.memberSince).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Account ID</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{profile.id}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.6}>
            <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveBtn: { fontSize: 16, fontWeight: "600" },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  avatarHint: { fontSize: 13, marginTop: 8 },
  formSection: { paddingHorizontal: 16, gap: 0 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  inputGroup: { borderBottomWidth: 0.5, paddingVertical: 10 },
  inputLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  input: { fontSize: 16, fontWeight: "500", paddingVertical: 2 },
  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifyText: { fontSize: 14, fontWeight: "600" },
  verifySubtext: { fontSize: 12, marginTop: 2 },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  deleteBtn: { alignItems: "center", marginTop: 24, paddingVertical: 12 },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
});
