import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDriver, VEHICLE_TYPES } from "@/lib/driver-store";

const STEPS = ["Personal Info", "Vehicle", "Documents", "Review"];

export default function DriverOnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { register } = useDriver();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    vehicleType: "car" as "car" | "motorcycle" | "bicycle" | "van",
    vehicleMake: "", vehicleModel: "", vehicleColor: "", licensePlate: "",
    driversLicense: "", insuranceNumber: "",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const canNext = () => {
    if (step === 0) return form.firstName && form.lastName && form.email && form.phone;
    if (step === 1) return form.vehicleMake && form.vehicleModel && form.vehicleColor && form.licensePlate;
    if (step === 2) return form.driversLicense && form.insuranceNumber;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      register(form);
      Alert.alert("Welcome to LiquorDash!", "Your driver account has been created. You can now go online and start accepting deliveries.", [
        { text: "Start Driving", onPress: () => router.replace("/driver/dashboard" as any) },
      ]);
    }
  };

  const renderInput = (label: string, key: string, placeholder: string, keyboardType: any = "default") => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
        value={(form as any)[key]}
        onChangeText={(v) => update(key, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Become a Driver</Text>
          <Text style={[styles.stepLabel, { color: colors.muted }]}>{step + 1}/{STEPS.length}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: i <= step ? "#1B6B3A" : colors.border }]}>
                {i < step && <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />}
                {i === step && <Text style={styles.progressDotText}>{i + 1}</Text>}
                {i > step && <Text style={[styles.progressDotText, { color: colors.muted }]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.progressLabel, { color: i <= step ? colors.foreground : colors.muted }]}>{s}</Text>
            </View>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Personal Information</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>Tell us about yourself so customers know who's delivering.</Text>
              {renderInput("First Name", "firstName", "John")}
              {renderInput("Last Name", "lastName", "Smith")}
              {renderInput("Email", "email", "john@example.com", "email-address")}
              {renderInput("Phone", "phone", "(415) 555-0100", "phone-pad")}
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Vehicle Information</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>What will you be driving for deliveries?</Text>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Vehicle Type</Text>
              <View style={styles.vehicleRow}>
                {VEHICLE_TYPES.map((vt) => (
                  <TouchableOpacity
                    key={vt.value}
                    onPress={() => update("vehicleType", vt.value)}
                    style={[styles.vehicleChip, {
                      backgroundColor: form.vehicleType === vt.value ? "#1B6B3A" : colors.surface,
                      borderColor: form.vehicleType === vt.value ? "#1B6B3A" : colors.border,
                    }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vehicleEmoji}>{vt.icon}</Text>
                    <Text style={[styles.vehicleLabel, { color: form.vehicleType === vt.value ? "#fff" : colors.foreground }]}>{vt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {renderInput("Make", "vehicleMake", "Toyota")}
              {renderInput("Model", "vehicleModel", "Camry")}
              {renderInput("Color", "vehicleColor", "Silver")}
              {renderInput("License Plate", "licensePlate", "ABC 1234")}
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Documents</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>We need your license and insurance info for verification.</Text>
              {renderInput("Driver's License #", "driversLicense", "D1234567")}
              {renderInput("Insurance Policy #", "insuranceNumber", "INS-987654")}
              <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="shield.fill" size={20} color="#1B6B3A" />
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  Your documents are encrypted and stored securely. We verify all drivers before activation.
                </Text>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Review Your Application</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>Please confirm your details before submitting.</Text>

              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.reviewSection, { color: colors.muted }]}>Personal</Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>{form.firstName} {form.lastName}</Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>{form.email}</Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>{form.phone}</Text>
              </View>

              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.reviewSection, { color: colors.muted }]}>Vehicle</Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>
                  {VEHICLE_TYPES.find((v) => v.value === form.vehicleType)?.icon} {form.vehicleColor} {form.vehicleMake} {form.vehicleModel}
                </Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>Plate: {form.licensePlate}</Text>
              </View>

              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.reviewSection, { color: colors.muted }]}>Documents</Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>License: {form.driversLicense}</Text>
                <Text style={[styles.reviewItem, { color: colors.foreground }]}>Insurance: {form.insuranceNumber}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: canNext() ? "#1B6B3A" : colors.border }]}
            activeOpacity={0.7}
            disabled={!canNext()}
          >
            <Text style={styles.nextBtnText}>{step === 3 ? "Submit Application" : "Continue"}</Text>
            <IconSymbol name="arrow.right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  stepLabel: { fontSize: 14, fontWeight: "600" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 12 },
  progressItem: { alignItems: "center", gap: 4 },
  progressDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  progressDotText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  progressLabel: { fontSize: 10, fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  stepContent: { gap: 12 },
  stepTitle: { fontSize: 22, fontWeight: "800" },
  stepDesc: { fontSize: 14, lineHeight: 20 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: { fontSize: 16, fontWeight: "500", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  vehicleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  vehicleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  vehicleEmoji: { fontSize: 18 },
  vehicleLabel: { fontSize: 14, fontWeight: "600" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
  reviewCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6, marginBottom: 12 },
  reviewSection: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  reviewItem: { fontSize: 15, fontWeight: "500" },
  bottomBar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
