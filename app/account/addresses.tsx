import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer, SavedAddress } from "@/lib/customer-store";

const LABELS = ["Home", "Work", "Other"];

function AddressForm({
  visible,
  onClose,
  onSave,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (addr: Omit<SavedAddress, "id">) => void;
  initial?: SavedAddress;
}) {
  const colors = useColors();
  const [label, setLabel] = useState(initial?.label || "Home");
  const [fullName, setFullName] = useState(initial?.fullName || "");
  const [street, setStreet] = useState(initial?.street || "");
  const [apt, setApt] = useState(initial?.apt || "");
  const [city, setCity] = useState(initial?.city || "");
  const [state, setState] = useState(initial?.state || "");
  const [zip, setZip] = useState(initial?.zip || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [instructions, setInstructions] = useState(initial?.instructions || "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);

  const handleSave = () => {
    if (!fullName.trim() || !street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    onSave({ label, fullName: fullName.trim(), street: street.trim(), apt: apt.trim(), city: city.trim(), state: state.trim(), zip: zip.trim(), phone: phone.trim(), instructions: instructions.trim(), isDefault });
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
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{initial ? "Edit Address" : "Add Address"}</Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.6}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            {/* Label Selector */}
            <View style={styles.labelRow}>
              {LABELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLabel(l)}
                  style={[styles.labelChip, { backgroundColor: label === l ? colors.primary : colors.surface, borderColor: label === l ? colors.primary : colors.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.labelChipText, { color: label === l ? "#fff" : colors.foreground }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Full Name *</Text>
              <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={fullName} onChangeText={setFullName} placeholder="John Doe" placeholderTextColor={colors.muted} autoCapitalize="words" />
            </View>
            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Street Address *</Text>
              <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={street} onChangeText={setStreet} placeholder="123 Main St" placeholderTextColor={colors.muted} />
            </View>
            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Apt / Suite / Floor</Text>
              <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={apt} onChangeText={setApt} placeholder="Apt 4B" placeholderTextColor={colors.muted} />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.flex1, { borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>City *</Text>
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={city} onChangeText={setCity} placeholder="New York" placeholderTextColor={colors.muted} />
              </View>
              <View style={[styles.field, { width: 70, borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>State *</Text>
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={state} onChangeText={setState} placeholder="NY" placeholderTextColor={colors.muted} autoCapitalize="characters" maxLength={2} />
              </View>
              <View style={[styles.field, { width: 90, borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>ZIP *</Text>
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={zip} onChangeText={setZip} placeholder="10001" placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={5} />
              </View>
            </View>
            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Phone</Text>
              <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={phone} onChangeText={setPhone} placeholder="(555) 123-4567" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
            </View>
            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Delivery Instructions</Text>
              <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={instructions} onChangeText={setInstructions} placeholder="Leave at door, ring bell, etc." placeholderTextColor={colors.muted} multiline />
            </View>

            <TouchableOpacity onPress={() => setIsDefault(!isDefault)} style={styles.defaultToggle} activeOpacity={0.6}>
              <IconSymbol name={isDefault ? "checkmark.circle.fill" : "circle"} size={22} color={isDefault ? colors.primary : colors.muted} />
              <Text style={[styles.defaultToggleText, { color: colors.foreground }]}>Set as default address</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function AddressesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useCustomer();
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | undefined>();

  const handleDelete = (id: string) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAddress(id) },
    ]);
  };

  const handleEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setShowForm(true);
  };

  const handleSave = (addr: Omit<SavedAddress, "id">) => {
    if (editingAddress) {
      updateAddress(editingAddress.id, addr);
    } else {
      addAddress(addr);
    }
    setEditingAddress(undefined);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Saved Addresses</Text>
        <TouchableOpacity onPress={() => { setEditingAddress(undefined); setShowForm(true); }} activeOpacity={0.6}>
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="location.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Addresses</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Add an address for faster checkout</Text>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={styles.addBtnText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: addr.isDefault ? colors.primary : colors.border }]}>
              <View style={styles.addressTop}>
                <View style={[styles.labelBadge, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name="location.fill" size={14} color={colors.primary} />
                  <Text style={[styles.labelBadgeText, { color: colors.primary }]}>{addr.label}</Text>
                </View>
                {addr.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.success + "15" }]}>
                    <Text style={[styles.defaultBadgeText, { color: colors.success }]}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.addressName, { color: colors.foreground }]}>{addr.fullName}</Text>
              <Text style={[styles.addressLine, { color: colors.muted }]}>
                {addr.street}{addr.apt ? `, ${addr.apt}` : ""}
              </Text>
              <Text style={[styles.addressLine, { color: colors.muted }]}>
                {addr.city}, {addr.state} {addr.zip}
              </Text>
              {addr.phone ? <Text style={[styles.addressLine, { color: colors.muted }]}>{addr.phone}</Text> : null}
              {addr.instructions ? (
                <Text style={[styles.instructionsText, { color: colors.muted }]}>📝 {addr.instructions}</Text>
              ) : null}
              <View style={styles.addressActions}>
                {!addr.isDefault && (
                  <TouchableOpacity onPress={() => setDefaultAddress(addr.id)} style={[styles.actionBtn, { borderColor: colors.border }]} activeOpacity={0.6}>
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleEdit(addr)} style={[styles.actionBtn, { borderColor: colors.border }]} activeOpacity={0.6}>
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(addr.id)} style={[styles.actionBtn, { borderColor: colors.border }]} activeOpacity={0.6}>
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AddressForm
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingAddress(undefined); }}
        onSave={handleSave}
        initial={editingAddress}
      />
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
  addressCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  addressTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  labelBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  labelBadgeText: { fontSize: 12, fontWeight: "600" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultBadgeText: { fontSize: 11, fontWeight: "600" },
  addressName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  addressLine: { fontSize: 13, lineHeight: 18 },
  instructionsText: { fontSize: 12, marginTop: 6, fontStyle: "italic" },
  addressActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: "500" },
  // Modal
  modalContainer: { flex: 1, paddingTop: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSave: { fontSize: 16, fontWeight: "600" },
  modalContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  labelRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  labelChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  labelChipText: { fontSize: 14, fontWeight: "500" },
  field: { borderBottomWidth: 0.5, paddingVertical: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  fieldInput: { fontSize: 16, fontWeight: "500", paddingVertical: 2 },
  row: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  defaultToggle: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, marginTop: 4 },
  defaultToggleText: { fontSize: 15, fontWeight: "500" },
  circle: {},
});
