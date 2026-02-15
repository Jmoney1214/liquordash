import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer, PaymentMethod, CardBrand } from "@/lib/customer-store";

const BRAND_ICONS: Record<CardBrand, { name: string; color: string }> = {
  visa: { name: "Visa", color: "#1A1F71" },
  mastercard: { name: "Mastercard", color: "#EB001B" },
  amex: { name: "Amex", color: "#006FCF" },
  discover: { name: "Discover", color: "#FF6000" },
};

function detectBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, "");
  if (n.startsWith("4")) return "visa";
  if (n.startsWith("5") || n.startsWith("2")) return "mastercard";
  if (n.startsWith("3")) return "amex";
  return "discover";
}

function AddCardModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (card: Omit<PaymentMethod, "id">) => void;
}) {
  const colors = useColors();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    return cleaned;
  };

  const handleSave = () => {
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.length < 13 || !expiry || expiry.length < 4 || !cvv || cvv.length < 3 || !name.trim()) {
      Alert.alert("Error", "Please fill in all card details correctly.");
      return;
    }
    const [expMonth, expYear] = expiry.split("/").map(Number);
    onSave({
      type: "card",
      brand: detectBrand(cleanNum),
      last4: cleanNum.slice(-4),
      expMonth,
      expYear: 2000 + expYear,
      holderName: name.trim(),
      isDefault,
    });
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setName("");
    setIsDefault(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <Text style={[styles.modalCancel, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Card</Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.6}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Card Preview */}
            <View style={[styles.cardPreview, { backgroundColor: colors.primary }]}>
              <Text style={styles.cardPreviewBrand}>{BRAND_ICONS[detectBrand(cardNumber)].name}</Text>
              <Text style={styles.cardPreviewNumber}>
                {cardNumber || "•••• •••• •••• ••••"}
              </Text>
              <View style={styles.cardPreviewBottom}>
                <View>
                  <Text style={styles.cardPreviewLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardPreviewValue}>{name || "YOUR NAME"}</Text>
                </View>
                <View>
                  <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
                  <Text style={styles.cardPreviewValue}>{expiry || "MM/YY"}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Card Number</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.flex1, { borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Expiry</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground }]}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={[styles.field, styles.flex1, { borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>CVV</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground }]}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Cardholder Name</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity onPress={() => setIsDefault(!isDefault)} style={styles.defaultToggle} activeOpacity={0.6}>
              <IconSymbol name={isDefault ? "checkmark.circle.fill" : "circle"} size={22} color={isDefault ? colors.primary : colors.muted} />
              <Text style={[styles.defaultToggleText, { color: colors.foreground }]}>Set as default payment</Text>
            </TouchableOpacity>

            <View style={[styles.secureNote, { backgroundColor: colors.surface }]}>
              <IconSymbol name="lock.fill" size={16} color={colors.success} />
              <Text style={[styles.secureNoteText, { color: colors.muted }]}>Your card info is encrypted and securely stored</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function PaymentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { paymentMethods, addPayment, deletePayment, setDefaultPayment } = useCustomer();
  const [showAddCard, setShowAddCard] = useState(false);

  const handleDelete = (id: string) => {
    Alert.alert("Remove Card", "Are you sure you want to remove this payment method?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deletePayment(id) },
    ]);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Payment Methods</Text>
        <TouchableOpacity onPress={() => setShowAddCard(true)} activeOpacity={0.6}>
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="creditcard.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Payment Methods</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Add a card for faster checkout</Text>
            <TouchableOpacity onPress={() => setShowAddCard(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {paymentMethods.map((pm) => {
              const brandInfo = BRAND_ICONS[pm.brand];
              return (
                <View key={pm.id} style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: pm.isDefault ? colors.primary : colors.border }]}>
                  <View style={styles.paymentTop}>
                    <View style={[styles.brandBadge, { backgroundColor: brandInfo.color + "15" }]}>
                      <Text style={[styles.brandBadgeText, { color: brandInfo.color }]}>{brandInfo.name}</Text>
                    </View>
                    {pm.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.success + "15" }]}>
                        <Text style={[styles.defaultBadgeText, { color: colors.success }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardNumberDisplay, { color: colors.foreground }]}>•••• •••• •••• {pm.last4}</Text>
                  <Text style={[styles.cardHolder, { color: colors.muted }]}>{pm.holderName} · Exp {pm.expMonth.toString().padStart(2, "0")}/{pm.expYear.toString().slice(-2)}</Text>
                  <View style={styles.paymentActions}>
                    {!pm.isDefault && (
                      <TouchableOpacity onPress={() => setDefaultPayment(pm.id)} style={[styles.actionBtn, { borderColor: colors.border }]} activeOpacity={0.6}>
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(pm.id)} style={[styles.actionBtn, { borderColor: colors.border }]} activeOpacity={0.6}>
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Digital Wallets */}
            <View style={styles.walletSection}>
              <Text style={[styles.walletTitle, { color: colors.muted }]}>Digital Wallets</Text>
              <TouchableOpacity style={[styles.walletBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.6}>
                <Text style={[styles.walletBtnText, { color: colors.foreground }]}> Apple Pay</Text>
                <Text style={[styles.walletStatus, { color: colors.muted }]}>Not connected</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.walletBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.6}>
                <Text style={[styles.walletBtnText, { color: colors.foreground }]}>Google Pay</Text>
                <Text style={[styles.walletStatus, { color: colors.muted }]}>Not connected</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <AddCardModal visible={showAddCard} onClose={() => setShowAddCard(false)} onSave={addPayment} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptySubtitle: { fontSize: 14 },
  addBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  paymentCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  paymentTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  brandBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  brandBadgeText: { fontSize: 12, fontWeight: "700" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultBadgeText: { fontSize: 11, fontWeight: "600" },
  cardNumberDisplay: { fontSize: 18, fontWeight: "600", letterSpacing: 1, marginBottom: 4 },
  cardHolder: { fontSize: 13 },
  paymentActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: "500" },
  walletSection: { marginTop: 16, gap: 8 },
  walletTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  walletBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  walletBtnText: { fontSize: 15, fontWeight: "500" },
  walletStatus: { fontSize: 13 },
  // Modal
  modalContainer: { flex: 1, paddingTop: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSave: { fontSize: 16, fontWeight: "600" },
  modalContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  cardPreview: { borderRadius: 16, padding: 20, marginBottom: 8, height: 180, justifyContent: "space-between" },
  cardPreviewBrand: { color: "#fff", fontSize: 16, fontWeight: "700", opacity: 0.9 },
  cardPreviewNumber: { color: "#fff", fontSize: 20, fontWeight: "600", letterSpacing: 2 },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewLabel: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "600", letterSpacing: 0.5 },
  cardPreviewValue: { color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 2 },
  field: { borderBottomWidth: 0.5, paddingVertical: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  fieldInput: { fontSize: 16, fontWeight: "500", paddingVertical: 2 },
  row: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  defaultToggle: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  defaultToggleText: { fontSize: 15, fontWeight: "500" },
  secureNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, marginTop: 4 },
  secureNoteText: { fontSize: 13, flex: 1 },
});
