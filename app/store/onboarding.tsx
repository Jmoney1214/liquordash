import { useState, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStore } from "@/lib/store-context";
import { getApplicationStepTitle, StoreApplication } from "@/lib/store-data";

const TOTAL_STEPS = 5;

function ProgressBar({ step, total }: { step: number; total: number }) {
  const colors = useColors();
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            {
              backgroundColor: i <= step ? colors.primary : colors.border,
              flex: 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  secureTextEntry?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        style={[
          styles.fieldInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.foreground,
          },
          multiline && { height: 80, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

function SelectField({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.selectOption,
              {
                backgroundColor: value === opt.value ? colors.primary : colors.surface,
                borderColor: value === opt.value ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectOptionText,
                { color: value === opt.value ? "#fff" : colors.foreground },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Step 1: Business Info
function BusinessInfoStep({ app, onUpdate }: { app: StoreApplication; onUpdate: (u: Partial<StoreApplication>) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Tell us about your business. This information will be used for verification and your store profile.
      </Text>
      <FormField
        label="Business Name *"
        value={app.businessName}
        onChangeText={(t) => onUpdate({ businessName: t })}
        placeholder="e.g. Downtown Spirits"
        autoCapitalize="words"
      />
      <SelectField
        label="Business Type *"
        options={[
          { value: "independent", label: "Independent" },
          { value: "chain", label: "Chain" },
          { value: "franchise", label: "Franchise" },
        ]}
        value={app.businessType}
        onSelect={(v) => onUpdate({ businessType: v as any })}
      />
      <FormField
        label="Owner Full Name *"
        value={app.ownerName}
        onChangeText={(t) => onUpdate({ ownerName: t })}
        placeholder="John Smith"
        autoCapitalize="words"
      />
      <FormField
        label="Owner Email *"
        value={app.ownerEmail}
        onChangeText={(t) => onUpdate({ ownerEmail: t })}
        placeholder="john@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField
        label="Owner Phone *"
        value={app.ownerPhone}
        onChangeText={(t) => onUpdate({ ownerPhone: t })}
        placeholder="(555) 123-4567"
        keyboardType="phone-pad"
      />
      <FormField
        label="EIN (Employer ID Number)"
        value={app.ein}
        onChangeText={(t) => onUpdate({ ein: t })}
        placeholder="XX-XXXXXXX"
        keyboardType="numeric"
      />
    </View>
  );
}

// Step 2: Store Details
function StoreDetailsStep({ app, onUpdate }: { app: StoreApplication; onUpdate: (u: Partial<StoreApplication>) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Provide your store location and contact details. Customers will see this information when browsing nearby stores.
      </Text>
      <FormField
        label="Store Address *"
        value={app.storeAddress}
        onChangeText={(t) => onUpdate({ storeAddress: t })}
        placeholder="456 Main Street"
      />
      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <FormField
            label="City *"
            value={app.storeCity}
            onChangeText={(t) => onUpdate({ storeCity: t })}
            placeholder="New York"
            autoCapitalize="words"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            label="State *"
            value={app.storeState}
            onChangeText={(t) => onUpdate({ storeState: t })}
            placeholder="NY"
            autoCapitalize="none"
          />
        </View>
      </View>
      <FormField
        label="ZIP Code *"
        value={app.storeZip}
        onChangeText={(t) => onUpdate({ storeZip: t })}
        placeholder="10001"
        keyboardType="numeric"
      />
      <FormField
        label="Store Phone *"
        value={app.storePhone}
        onChangeText={(t) => onUpdate({ storePhone: t })}
        placeholder="(555) 123-4567"
        keyboardType="phone-pad"
      />
      <FormField
        label="Website (optional)"
        value={app.storeWebsite}
        onChangeText={(t) => onUpdate({ storeWebsite: t })}
        placeholder="www.mystore.com"
        autoCapitalize="none"
      />
    </View>
  );
}

// Step 3: Licensing
function LicensingStep({ app, onUpdate }: { app: StoreApplication; onUpdate: (u: Partial<StoreApplication>) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        We need your liquor license information for compliance verification. All license data is securely stored and encrypted.
      </Text>
      <SelectField
        label="License Type *"
        options={[
          { value: "retail", label: "Retail" },
          { value: "wholesale", label: "Wholesale" },
          { value: "manufacturer", label: "Manufacturer" },
          { value: "distributor", label: "Distributor" },
        ]}
        value={app.licenseType}
        onSelect={(v) => onUpdate({ licenseType: v as any })}
      />
      <FormField
        label="License Number *"
        value={app.licenseNumber}
        onChangeText={(t) => onUpdate({ licenseNumber: t })}
        placeholder="e.g. LIQ-2024-12345"
      />
      <FormField
        label="Issuing State *"
        value={app.licenseState}
        onChangeText={(t) => onUpdate({ licenseState: t })}
        placeholder="NY"
        autoCapitalize="none"
      />
      <FormField
        label="License Expiry Date *"
        value={app.licenseExpiry}
        onChangeText={(t) => onUpdate({ licenseExpiry: t })}
        placeholder="MM/DD/YYYY"
      />
    </View>
  );
}

// Step 4: Operations
function OperationsStep({ app, onUpdate }: { app: StoreApplication; onUpdate: (u: Partial<StoreApplication>) => void }) {
  const colors = useColors();
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Configure your delivery capabilities and operating preferences. You can update these anytime from your dashboard.
      </Text>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <IconSymbol name="bolt.fill" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Express Delivery</Text>
            <Text style={[styles.switchDesc, { color: colors.muted }]}>
              Deliver within 60 minutes to nearby customers
            </Text>
          </View>
        </View>
        <Switch
          value={app.supportsExpress}
          onValueChange={(v) => onUpdate({ supportsExpress: v })}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {app.supportsExpress && (
        <FormField
          label="Express Delivery Radius (miles)"
          value={String(app.expressDeliveryRadius)}
          onChangeText={(t) => onUpdate({ expressDeliveryRadius: parseInt(t) || 0 })}
          placeholder="5"
          keyboardType="numeric"
        />
      )}

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <IconSymbol name="shippingbox.fill" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Nationwide Shipping</Text>
            <Text style={[styles.switchDesc, { color: colors.muted }]}>
              Ship premium bottles to customers across the US
            </Text>
          </View>
        </View>
        <Switch
          value={app.supportsShipping}
          onValueChange={(v) => onUpdate({ supportsShipping: v })}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <SelectField
        label="Average Inventory Size"
        options={[
          { value: "small", label: "< 500 SKUs" },
          { value: "medium", label: "500-2000" },
          { value: "large", label: "2000+" },
        ]}
        value={app.averageInventorySize}
        onSelect={(v) => onUpdate({ averageInventorySize: v })}
      />
    </View>
  );
}

// Step 5: Payment
function PaymentStep({ app, onUpdate }: { app: StoreApplication; onUpdate: (u: Partial<StoreApplication>) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Set up your payout information. You'll receive weekly payouts for completed orders minus the 15% platform commission.
      </Text>
      <FormField
        label="Bank Name *"
        value={app.bankName}
        onChangeText={(t) => onUpdate({ bankName: t })}
        placeholder="Chase Bank"
        autoCapitalize="words"
      />
      <FormField
        label="Routing Number *"
        value={app.routingNumber}
        onChangeText={(t) => onUpdate({ routingNumber: t })}
        placeholder="XXXXXXXXX"
        keyboardType="numeric"
      />
      <FormField
        label="Account Number *"
        value={app.accountNumber}
        onChangeText={(t) => onUpdate({ accountNumber: t })}
        placeholder="XXXXXXXXXXXX"
        keyboardType="numeric"
        secureTextEntry
      />
      <SelectField
        label="Account Type *"
        options={[
          { value: "checking", label: "Checking" },
          { value: "savings", label: "Savings" },
        ]}
        value={app.accountType}
        onSelect={(v) => onUpdate({ accountType: v as any })}
      />

      <View style={[styles.infoCard, { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" }]}>
        <IconSymbol name="info.circle.fill" size={20} color="#F57C00" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: "#E65100" }]}>Commission Structure</Text>
          <Text style={[styles.infoText, { color: "#BF360C" }]}>
            LiquorDash charges a 15% commission on each order. Payouts are processed weekly via direct deposit.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function StoreOnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { application, startApplication, updateApplication, submitApplication, approveApplication } = useStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize application if not started
  const app = application ?? startApplication();

  const onUpdate = useCallback(
    (updates: Partial<StoreApplication>) => {
      updateApplication(updates);
    },
    [updateApplication]
  );

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit
      Alert.alert(
        "Submit Application",
        "Are you ready to submit your store partner application? Our team will review it within 1-2 business days.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Submit",
            onPress: () => {
              submitApplication();
              // For demo purposes, auto-approve after short delay
              setTimeout(() => {
                approveApplication();
                Alert.alert(
                  "Application Approved! 🎉",
                  "Welcome to LiquorDash! Your store is now live. Switch to Store Mode from your profile to manage orders.",
                  [{ text: "Go to Dashboard", onPress: () => router.replace("/store/dashboard" as any) }]
                );
              }, 1500);
            },
          },
        ]
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <BusinessInfoStep app={app} onUpdate={onUpdate} />;
      case 1: return <StoreDetailsStep app={app} onUpdate={onUpdate} />;
      case 2: return <LicensingStep app={app} onUpdate={onUpdate} />;
      case 3: return <OperationsStep app={app} onUpdate={onUpdate} />;
      case 4: return <PaymentStep app={app} onUpdate={onUpdate} />;
      default: return null;
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Become a Partner
            </Text>
            <Text style={[styles.headerStep, { color: colors.muted }]}>
              Step {currentStep + 1} of {TOTAL_STEPS}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ProgressBar step={currentStep} total={TOTAL_STEPS} />

        {/* Step Title */}
        <View style={styles.stepTitleContainer}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            {getApplicationStepTitle(currentStep)}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: colors.primary, flex: currentStep === 0 ? 1 : undefined }]}
            activeOpacity={0.7}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === TOTAL_STEPS - 1 ? "Submit Application" : "Continue"}
            </Text>
            {currentStep < TOTAL_STEPS - 1 && (
              <IconSymbol name="arrow.right" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerStep: {
    fontSize: 12,
    marginTop: 1,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  stepTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  stepContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingTop: 8,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#687076",
    marginBottom: 4,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  selectRow: {
    flexDirection: "row",
    gap: 8,
  },
  selectOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  selectOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  switchDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
