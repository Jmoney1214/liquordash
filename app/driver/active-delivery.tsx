import { useEffect, useRef, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking, Platform, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDriver, formatCurrency, getDeliverySteps, JOB_STATUS_LABELS, JOB_STATUS_COLORS, DeliveryJobStatus } from "@/lib/driver-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function DeliveryProgressBar({ status }: { status: DeliveryJobStatus }) {
  const colors = useColors();
  const steps = getDeliverySteps(status);

  return (
    <View style={pStyles.container}>
      {steps.map((step, i) => (
        <View key={step.label} style={pStyles.stepRow}>
          <View style={pStyles.stepIndicator}>
            <View style={[pStyles.dot, {
              backgroundColor: step.completed ? "#1B6B3A" : step.active ? "#F59E0B" : colors.border,
            }]}>
              {step.completed && <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />}
              {step.active && <View style={pStyles.activePulse} />}
            </View>
            {i < steps.length - 1 && (
              <View style={[pStyles.line, { backgroundColor: step.completed ? "#1B6B3A" : colors.border }]} />
            )}
          </View>
          <Text style={[pStyles.label, {
            color: step.completed ? "#1B6B3A" : step.active ? colors.foreground : colors.muted,
            fontWeight: step.active ? "700" : "400",
          }]}>{step.label}</Text>
        </View>
      ))}
    </View>
  );
}

const pStyles = StyleSheet.create({
  container: { paddingVertical: 8 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepIndicator: { alignItems: "center", width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  line: { width: 2, height: 20, marginVertical: 2 },
  label: { fontSize: 14, paddingTop: 1, lineHeight: 20 },
});

export default function ActiveDeliveryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { activeJob, currentLocation, updateJobStatus, completeJob, cancelJob, advanceSimulation, routeWaypoints, currentWaypointIndex } = useDriver();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!activeJob) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.emptyState}>
          <IconSymbol name="car.fill" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Active Delivery</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Accept a delivery from the dashboard to begin.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: "#1B6B3A" }]} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const formatElapsed = () => {
    const m = Math.floor(elapsedTime / 60);
    const s = elapsedTime % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getNextAction = (): { label: string; status: DeliveryJobStatus; color: string } | null => {
    switch (activeJob.status) {
      case "accepted": return { label: "Navigate to Store", status: "arriving-store", color: "#3B82F6" };
      case "arriving-store": return { label: "Arrived at Store", status: "at-store", color: "#F59E0B" };
      case "at-store": return { label: "Picked Up Order", status: "picked-up", color: "#8B5CF6" };
      case "picked-up": return { label: "Start Delivery", status: "en-route", color: "#10B981" };
      case "en-route": return { label: "Arriving at Customer", status: "arriving", color: "#10B981" };
      case "arriving": return { label: "Complete Delivery", status: "delivered", color: "#1B6B3A" };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  const handleNextStep = () => {
    if (!nextAction) return;
    if (nextAction.status === "delivered") {
      Alert.alert("Complete Delivery?", "Confirm that you've handed the order to the customer.", [
        { text: "Cancel", style: "cancel" },
        { text: "Complete", onPress: () => { completeJob(); router.replace("/driver/dashboard" as any); } },
      ]);
    } else {
      updateJobStatus(nextAction.status);
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancel Delivery?", "This will affect your acceptance rate.", [
      { text: "Keep Delivering", style: "cancel" },
      { text: "Cancel", style: "destructive", onPress: () => { cancelJob(); router.replace("/driver/dashboard" as any); } },
    ]);
  };

  const handleCallCustomer = () => {
    Linking.openURL(`tel:${activeJob.customerPhone}`);
  };

  const handleNavigate = () => {
    const dest = activeJob.status === "accepted" || activeJob.status === "arriving-store" || activeJob.status === "at-store"
      ? activeJob.storeLocation
      : activeJob.deliveryLocation;
    const url = Platform.select({
      ios: `maps:?daddr=${dest.latitude},${dest.longitude}`,
      android: `google.navigation:q=${dest.latitude},${dest.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const statusColor = JOB_STATUS_COLORS[activeJob.status];
  const progress = routeWaypoints.length > 0 ? Math.round((currentWaypointIndex / (routeWaypoints.length - 1)) * 100) : 0;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusColor }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerStatus}>{JOB_STATUS_LABELS[activeJob.status]}</Text>
          <Text style={styles.headerTimer}>{formatElapsed()} elapsed</Text>
        </View>
        <TouchableOpacity onPress={handleNavigate} activeOpacity={0.6}>
          <IconSymbol name="location.north.line.fill" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Placeholder with GPS Simulation */}
        <View style={[styles.mapContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.mapContent}>
            <View style={[styles.mapPin, { backgroundColor: statusColor }]}>
              <IconSymbol name="car.fill" size={24} color="#fff" />
            </View>
            <Text style={[styles.mapCoords, { color: colors.muted }]}>
              {currentLocation.coordinate.latitude.toFixed(4)}°N, {Math.abs(currentLocation.coordinate.longitude).toFixed(4)}°W
            </Text>
            <Text style={[styles.mapSpeed, { color: colors.foreground }]}>
              {currentLocation.speed.toFixed(0)} mph • Heading {currentLocation.heading.toFixed(0)}°
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: statusColor }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>{progress}% of route</Text>
            </View>

            {/* Simulate Button */}
            <TouchableOpacity
              onPress={advanceSimulation}
              style={[styles.simBtn, { backgroundColor: statusColor + "20", borderColor: statusColor }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="play.fill" size={14} color={statusColor} />
              <Text style={[styles.simBtnText, { color: statusColor }]}>Simulate Movement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Order</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{activeJob.orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Earnings</Text>
            <Text style={[styles.infoValue, { color: "#1B6B3A" }]}>{formatCurrency(activeJob.totalPay)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Items</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{activeJob.itemCount} items</Text>
          </View>
        </View>

        {/* Route */}
        <View style={[styles.routeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.routeTitle, { color: colors.foreground }]}>Route</Text>

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: "#3B82F6" }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.routeLabel, { color: colors.muted }]}>PICKUP</Text>
              <Text style={[styles.routeName, { color: colors.foreground }]}>{activeJob.storeName}</Text>
              <Text style={[styles.routeAddress, { color: colors.muted }]}>{activeJob.storeAddress}</Text>
            </View>
          </View>

          <View style={[styles.routeConnector, { borderColor: colors.border }]} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: "#10B981" }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.routeLabel, { color: colors.muted }]}>DROP-OFF</Text>
              <Text style={[styles.routeName, { color: colors.foreground }]}>{activeJob.customerName}</Text>
              <Text style={[styles.routeAddress, { color: colors.muted }]}>{activeJob.deliveryAddress}</Text>
            </View>
          </View>

          {activeJob.specialInstructions && (
            <View style={[styles.instructions, { backgroundColor: "#F59E0B" + "15", borderColor: "#F59E0B" + "30" }]}>
              <IconSymbol name="info.circle.fill" size={16} color="#F59E0B" />
              <Text style={[styles.instructionsText, { color: colors.foreground }]}>{activeJob.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={[styles.itemsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.routeTitle, { color: colors.foreground }]}>Order Items</Text>
          {activeJob.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i < activeJob.items.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.itemQty, { color: colors.muted }]}>x{item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Progress Steps */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.routeTitle, { color: colors.foreground }]}>Delivery Progress</Text>
          <DeliveryProgressBar status={activeJob.status} />
        </View>

        {/* Customer Contact */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            onPress={handleCallCustomer}
            style={[styles.contactBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="phone.fill" size={20} color="#1B6B3A" />
            <Text style={[styles.contactBtnText, { color: colors.foreground }]}>Call Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNavigate}
            style={[styles.contactBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="location.north.line.fill" size={20} color="#3B82F6" />
            <Text style={[styles.contactBtnText, { color: colors.foreground }]}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel */}
        <TouchableOpacity onPress={handleCancel} style={styles.cancelRow} activeOpacity={0.6}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel Delivery</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom Action */}
      {nextAction && (
        <View style={[styles.bottomBar, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={handleNextStep}
            style={[styles.actionBtn, { backgroundColor: nextAction.color }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.right" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>{nextAction.label}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerStatus: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerTimer: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  mapContainer: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: "hidden" },
  mapContent: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 },
  mapPin: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  mapCoords: { fontSize: 12, marginBottom: 4 },
  mapSpeed: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  progressContainer: { width: "100%", marginBottom: 12 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, textAlign: "center", marginTop: 4 },
  simBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  simBtnText: { fontSize: 13, fontWeight: "600" },
  infoCard: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoRow: { flex: 1, alignItems: "center" },
  infoLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "700" },
  routeCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  routeTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  routePoint: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  routeName: { fontSize: 15, fontWeight: "600", marginTop: 1 },
  routeAddress: { fontSize: 12, marginTop: 2 },
  routeConnector: { width: 1, height: 20, marginLeft: 5, borderLeftWidth: 1, borderStyle: "dashed", marginVertical: 2 },
  instructions: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  instructionsText: { fontSize: 13, flex: 1, lineHeight: 18 },
  itemsCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  itemName: { fontSize: 14, fontWeight: "500" },
  itemQty: { fontSize: 14 },
  progressCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  contactRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 12 },
  contactBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  contactBtnText: { fontSize: 14, fontWeight: "600" },
  cancelRow: { alignItems: "center", paddingVertical: 16 },
  cancelText: { fontSize: 14, fontWeight: "600" },
  bottomBar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  backBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
