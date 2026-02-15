import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer, FAQ_DATA, SupportTicket } from "@/lib/customer-store";

const CATEGORIES: { value: SupportTicket["category"]; label: string; icon: any }[] = [
  { value: "order", label: "Order Issue", icon: "bag.fill" },
  { value: "delivery", label: "Delivery", icon: "shippingbox.fill" },
  { value: "payment", label: "Payment", icon: "creditcard.fill" },
  { value: "account", label: "Account", icon: "person.fill" },
  { value: "other", label: "Other", icon: "questionmark.circle.fill" },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)} style={[styles.faqItem, { borderColor: colors.border }]} activeOpacity={0.6}>
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{question}</Text>
        <IconSymbol name={expanded ? "chevron.right" : "chevron.right"} size={16} color={colors.muted} style={expanded ? { transform: [{ rotate: "90deg" }] } : undefined} />
      </View>
      {expanded && <Text style={[styles.faqAnswer, { color: colors.muted }]}>{answer}</Text>}
    </TouchableOpacity>
  );
}

function NewTicketModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { createTicket } = useCustomer();
  const [category, setCategory] = useState<SupportTicket["category"]>("order");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    createTicket(subject.trim(), category, message.trim());
    Alert.alert("Ticket Created", "We'll get back to you within 24 hours.", [{ text: "OK", onPress: onClose }]);
    setSubject("");
    setMessage("");
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <Text style={[styles.modalCancel, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Ticket</Text>
            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.6}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Submit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={[styles.categoryChip, { backgroundColor: category === cat.value ? colors.primary : colors.surface, borderColor: category === cat.value ? colors.primary : colors.border }]}
                  activeOpacity={0.7}
                >
                  <IconSymbol name={cat.icon} size={14} color={category === cat.value ? "#fff" : colors.muted} />
                  <Text style={[styles.categoryText, { color: category === cat.value ? "#fff" : colors.foreground }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Subject</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={[styles.field, { borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Message</Text>
              <TextInput
                style={[styles.fieldInput, styles.textArea, { color: colors.foreground }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function TicketCard({ ticket, onPress }: { ticket: SupportTicket; onPress: () => void }) {
  const colors = useColors();
  const statusColors: Record<string, string> = { open: colors.warning, "in-progress": colors.primary, resolved: colors.success, closed: colors.muted };
  const date = new Date(ticket.createdAt);

  return (
    <TouchableOpacity onPress={onPress} style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}>
      <View style={styles.ticketTop}>
        <Text style={[styles.ticketId, { color: colors.muted }]}>{ticket.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (statusColors[ticket.status] || colors.muted) + "15" }]}>
          <Text style={[styles.statusText, { color: statusColors[ticket.status] || colors.muted }]}>
            {ticket.status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Text>
        </View>
      </View>
      <Text style={[styles.ticketSubject, { color: colors.foreground }]}>{ticket.subject}</Text>
      <View style={styles.ticketBottom}>
        <Text style={[styles.ticketCategory, { color: colors.muted }]}>
          {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
        </Text>
        <Text style={[styles.ticketDate, { color: colors.muted }]}>
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </Text>
      </View>
      <Text style={[styles.ticketPreview, { color: colors.muted }]} numberOfLines={1}>
        {ticket.messages[ticket.messages.length - 1]?.text}
      </Text>
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { supportTickets } = useCustomer();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [activeTab, setActiveTab] = useState<"faq" | "tickets">("faq");

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity onPress={() => setShowNewTicket(true)} style={[styles.quickBtn, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
          <IconSymbol name="envelope.fill" size={18} color="#fff" />
          <Text style={styles.quickBtnText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} activeOpacity={0.7}>
          <IconSymbol name="phone.fill" size={18} color={colors.primary} />
          <Text style={[styles.quickBtnTextAlt, { color: colors.foreground }]}>Call Us</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => setActiveTab("faq")} style={[styles.tab, activeTab === "faq" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} activeOpacity={0.6}>
          <Text style={[styles.tabText, { color: activeTab === "faq" ? colors.primary : colors.muted }]}>FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("tickets")} style={[styles.tab, activeTab === "tickets" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} activeOpacity={0.6}>
          <Text style={[styles.tabText, { color: activeTab === "tickets" ? colors.primary : colors.muted }]}>
            My Tickets{supportTickets.length > 0 ? ` (${supportTickets.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === "faq" ? (
          <View style={styles.faqList}>
            {FAQ_DATA.map((faq) => (
              <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
            ))}
          </View>
        ) : (
          <View style={styles.ticketList}>
            {supportTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="envelope.fill" size={48} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Tickets</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>You haven't submitted any support tickets yet</Text>
              </View>
            ) : (
              supportTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onPress={() => {}} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <NewTicketModal visible={showNewTicket} onClose={() => setShowNewTicket(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  quickActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  quickBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  quickBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  quickBtnTextAlt: { fontSize: 14, fontWeight: "600" },
  tabBar: { flexDirection: "row", borderBottomWidth: 0.5, marginHorizontal: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  faqList: { marginTop: 12 },
  faqItem: { borderBottomWidth: 0.5, paddingVertical: 14 },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  ticketList: { marginTop: 12 },
  ticketCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  ticketId: { fontSize: 12, fontWeight: "500" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  ticketSubject: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  ticketBottom: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  ticketCategory: { fontSize: 12 },
  ticketDate: { fontSize: 12 },
  ticketPreview: { fontSize: 13, fontStyle: "italic" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  // Modal
  modalContainer: { flex: 1, paddingTop: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSave: { fontSize: 16, fontWeight: "600" },
  modalContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: "500" },
  field: { borderBottomWidth: 0.5, paddingVertical: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { fontSize: 16, fontWeight: "500", paddingVertical: 2 },
  textArea: { minHeight: 120 },
});
