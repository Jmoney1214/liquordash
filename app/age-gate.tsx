import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const AGE_VERIFIED_KEY = "liquordash_age_verified";

export async function checkAgeVerification(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(AGE_VERIFIED_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export default function AgeGateScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [error, setError] = useState("");

  const handleVerify = useCallback(async () => {
    const month = parseInt(selectedMonth);
    const day = parseInt(selectedDay);
    const year = parseInt(selectedYear);

    if (!month || !day || !year || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2010) {
      setError("Please enter a valid date of birth");
      return;
    }

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 21) {
      setError("You must be 21 or older to use this app");
      return;
    }

    await AsyncStorage.setItem(AGE_VERIFIED_KEY, "true");
    router.back();
  }, [selectedMonth, selectedDay, selectedYear, router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🔞</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Age Verification</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            You must be 21 years or older to use LiquorDash. Please enter your date of birth.
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Month</Text>
              <View style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    const val = parseInt(selectedMonth) || 0;
                    if (val < 12) setSelectedMonth(String(val + 1));
                  }}
                  style={styles.dateArrow}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>▲</Text>
                </TouchableOpacity>
                <Text style={[styles.dateValue, { color: colors.foreground }]}>
                  {selectedMonth || "MM"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const val = parseInt(selectedMonth) || 2;
                    if (val > 1) setSelectedMonth(String(val - 1));
                  }}
                  style={styles.dateArrow}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Day</Text>
              <View style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    const val = parseInt(selectedDay) || 0;
                    if (val < 31) setSelectedDay(String(val + 1));
                  }}
                  style={styles.dateArrow}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>▲</Text>
                </TouchableOpacity>
                <Text style={[styles.dateValue, { color: colors.foreground }]}>
                  {selectedDay || "DD"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const val = parseInt(selectedDay) || 2;
                    if (val > 1) setSelectedDay(String(val - 1));
                  }}
                  style={styles.dateArrow}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.dateField, { flex: 1.3 }]}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Year</Text>
              <View style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    const val = parseInt(selectedYear) || 1989;
                    if (val < 2010) setSelectedYear(String(val + 1));
                  }}
                  style={styles.dateArrow}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>▲</Text>
                </TouchableOpacity>
                <Text style={[styles.dateValue, { color: colors.foreground }]}>
                  {selectedYear || "YYYY"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const val = parseInt(selectedYear) || 1991;
                    if (val > 1920) setSelectedYear(String(val - 1));
                  }}
                  style={styles.dateArrow}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleVerify}
            style={[styles.verifyBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="person.badge.shield.checkmark.fill" size={20} color="#fff" />
            <Text style={styles.verifyBtnText}>Verify Age</Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            By verifying your age, you confirm that you are of legal drinking age in your jurisdiction. LiquorDash complies with all applicable alcohol laws and regulations.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  dateField: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  dateInput: {
    width: "100%",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
  },
  dateArrow: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 14,
  },
  dateValue: {
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 4,
  },
  verifyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 320,
  },
});
