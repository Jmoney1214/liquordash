import { useEffect, useState, useRef } from "react";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOrders } from "@/lib/orders-store";
import { useOrderTracking } from "@/hooks/use-websocket";
import { WsStatus, WsOfflineBanner } from "@/components/ws-status";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Simulated driver data for customer-facing tracking
interface DriverInfo {
  name: string;
  vehicle: string;
  licensePlate: string;
  rating: number;
  phone: string;
  avatarInitials: string;
  photo: string;
}

interface TrackingLocation {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  eta: number; // minutes
}

const SIMULATED_DRIVER: DriverInfo = {
  name: "Marcus J.",
  vehicle: "Silver Toyota Camry",
  licensePlate: "ABC 1234",
  rating: 4.9,
  phone: "(415) 555-0177",
  avatarInitials: "MJ",
  photo: "",
};

// Simulate driver moving along route
const ROUTE_POINTS: TrackingLocation[] = [
  { latitude: 37.7749, longitude: -122.4194, heading: 45, speed: 22, eta: 15 },
  { latitude: 37.7755, longitude: -122.4180, heading: 48, speed: 25, eta: 13 },
  { latitude: 37.7762, longitude: -122.4165, heading: 50, speed: 28, eta: 11 },
  { latitude: 37.7770, longitude: -122.4150, heading: 52, speed: 30, eta: 9 },
  { latitude: 37.7778, longitude: -122.4135, heading: 55, speed: 27, eta: 7 },
  { latitude: 37.7785, longitude: -122.4120, heading: 48, speed: 24, eta: 5 },
  { latitude: 37.7792, longitude: -122.4105, heading: 42, speed: 20, eta: 3 },
  { latitude: 37.7800, longitude: -122.4090, heading: 38, speed: 15, eta: 2 },
  { latitude: 37.7808, longitude: -122.4075, heading: 35, speed: 10, eta: 1 },
  { latitude: 37.7815, longitude: -122.4060, heading: 30, speed: 0, eta: 0 },
];

type TrackingStatus = "preparing" | "picking-up" | "on-the-way" | "nearby" | "arriving" | "delivered";

function getTrackingStatus(progress: number): TrackingStatus {
  if (progress < 0.1) return "preparing";
  if (progress < 0.3) return "picking-up";
  if (progress < 0.7) return "on-the-way";
  if (progress < 0.9) return "nearby";
  if (progress < 1) return "arriving";
  return "delivered";
}

const STATUS_CONFIG: Record<TrackingStatus, { label: string; color: string; message: string }> = {
  preparing: { label: "Preparing", color: "#F59E0B", message: "Your driver is heading to the store to pick up your order" },
  "picking-up": { label: "Picking Up", color: "#8B5CF6", message: "Your driver is at the store picking up your items" },
  "on-the-way": { label: "On the Way", color: "#3B82F6", message: "Your driver is en route with your order" },
  nearby: { label: "Nearby", color: "#10B981", message: "Your driver is getting close to your location" },
  arriving: { label: "Arriving Now", color: "#1B6B3A", message: "Your driver is almost at your door!" },
  delivered: { label: "Delivered", color: "#22C55E", message: "Your order has been delivered. Enjoy!" },
};

export default function LiveTrackingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder } = useOrders();
  const order = getOrder(id || "");

  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [location, setLocation] = useState(ROUTE_POINTS[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time WebSocket tracking
  const {
    status: wsStatus,
    driverLocation: wsDriverLocation,
    eta: wsEta,
    driverInfo: wsDriverInfo,
    events: wsEvents,
    isConnected,
  } = useOrderTracking(id || null);

  // Use WS driver location if available, otherwise simulate
  useEffect(() => {
    if (wsDriverLocation) {
      setLocation({
        latitude: wsDriverLocation.latitude,
        longitude: wsDriverLocation.longitude,
        heading: wsDriverLocation.heading,
        speed: 0,
        eta: wsEta ?? location.eta,
      });
      // Estimate progress from ETA
      if (wsEta !== null) {
        const estimatedProgress = Math.max(0, Math.min(1, 1 - (wsEta / 15)));
        const idx = Math.round(estimatedProgress * (ROUTE_POINTS.length - 1));
        setCurrentPointIndex(idx);
      }
      return;
    }
    // Fallback: simulate driver movement
    intervalRef.current = setInterval(() => {
      setCurrentPointIndex((prev) => {
        const next = Math.min(prev + 1, ROUTE_POINTS.length - 1);
        setLocation(ROUTE_POINTS[next]);
        return next;
      });
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [wsDriverLocation, wsEta]);

  const progress = currentPointIndex / (ROUTE_POINTS.length - 1);
  const trackingStatus = getTrackingStatus(progress);
  const statusConfig = STATUS_CONFIG[trackingStatus];

  const handleCallDriver = () => {
    Linking.openURL(`tel:${SIMULATED_DRIVER.phone}`);
  };

  // Use WS driver info if available
  const displayDriver = wsDriverInfo
    ? { ...SIMULATED_DRIVER, name: wsDriverInfo.name, phone: wsDriverInfo.phone, vehicle: wsDriverInfo.vehicle }
    : SIMULATED_DRIVER;

  return (
    <ScreenContainer>
      {/* Offline Banner */}
      <WsOfflineBanner />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusConfig.color }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Live Tracking</Text>
            <WsStatus showLabel size="small" />
          </View>
          <Text style={styles.headerSubtitle}>{order?.id || id}</Text>
        </View>
        <TouchableOpacity onPress={handleCallDriver} activeOpacity={0.6}>
          <IconSymbol name="phone.fill" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Area with GPS Visualization */}
        <View style={[styles.mapArea, { backgroundColor: colors.surface }]}>
          {/* Simulated Map View */}
          <View style={styles.mapContent}>
            {/* Route visualization */}
            <View style={styles.routeViz}>
              {/* Store marker */}
              <View style={styles.markerRow}>
                <View style={[styles.marker, { backgroundColor: "#3B82F6" }]}>
                  <IconSymbol name="storefront.fill" size={16} color="#fff" />
                </View>
                <Text style={[styles.markerLabel, { color: colors.muted }]}>Store</Text>
              </View>

              {/* Route line with driver position */}
              <View style={styles.routeLineContainer}>
                <View style={[styles.routeTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.routeProgress, { width: `${progress * 100}%`, backgroundColor: statusConfig.color }]} />
                </View>
                {/* Driver icon on route */}
                <View style={[styles.driverOnRoute, { left: `${Math.min(progress * 100, 95)}%` }]}>
                  <View style={[styles.driverDot, { backgroundColor: statusConfig.color }]}>
                    <IconSymbol name="car.fill" size={14} color="#fff" />
                  </View>
                </View>
              </View>

              {/* Delivery marker */}
              <View style={styles.markerRow}>
                <View style={[styles.marker, { backgroundColor: "#10B981" }]}>
                  <IconSymbol name="location.fill" size={16} color="#fff" />
                </View>
                <Text style={[styles.markerLabel, { color: colors.muted }]}>You</Text>
              </View>
            </View>

            {/* Coordinates */}
            <View style={styles.coordsRow}>
              <Text style={[styles.coordsText, { color: colors.muted }]}>
                {location.latitude.toFixed(4)}°N, {Math.abs(location.longitude).toFixed(4)}°W
              </Text>
              <Text style={[styles.coordsText, { color: colors.muted }]}>
                {location.speed} mph • {location.heading.toFixed(0)}° heading
              </Text>
            </View>
          </View>
        </View>

        {/* ETA Banner */}
        <View style={[styles.etaBanner, { backgroundColor: statusConfig.color }]}>
          <View style={styles.etaLeft}>
            <Text style={styles.etaLabel}>{statusConfig.label}</Text>
            <Text style={styles.etaMessage}>{statusConfig.message}</Text>
          </View>
          <View style={styles.etaRight}>
            <Text style={styles.etaTime}>{location.eta}</Text>
            <Text style={styles.etaUnit}>min</Text>
          </View>
        </View>

        {/* Driver Card */}
        <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.driverInfo}>
            <View style={[styles.driverAvatar, { backgroundColor: "#1B6B3A" }]}>
              <Text style={styles.driverAvatarText}>{SIMULATED_DRIVER.avatarInitials}</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>{SIMULATED_DRIVER.name}</Text>
              <Text style={[styles.driverVehicle, { color: colors.muted }]}>{SIMULATED_DRIVER.vehicle}</Text>
              <View style={styles.driverMeta}>
                <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                <Text style={[styles.driverRating, { color: colors.foreground }]}>{SIMULATED_DRIVER.rating}</Text>
                <Text style={[styles.driverPlate, { color: colors.muted }]}>• {SIMULATED_DRIVER.licensePlate}</Text>
              </View>
            </View>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity
              onPress={handleCallDriver}
              style={[styles.driverActionBtn, { backgroundColor: "#1B6B3A" + "15" }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="phone.fill" size={18} color="#1B6B3A" />
              <Text style={[styles.driverActionText, { color: "#1B6B3A" }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.driverActionBtn, { backgroundColor: "#3B82F6" + "15" }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="bubble.left.fill" size={18} color="#3B82F6" />
              <Text style={[styles.driverActionText, { color: "#3B82F6" }]}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Progress Steps */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.progressTitle, { color: colors.foreground }]}>Delivery Progress</Text>
          {[
            { label: "Order Confirmed", done: true },
            { label: "Driver Assigned", done: true },
            { label: "Heading to Store", done: progress >= 0.1 },
            { label: "Picked Up", done: progress >= 0.3 },
            { label: "On the Way", done: progress >= 0.5, active: progress >= 0.3 && progress < 0.9 },
            { label: "Delivered", done: progress >= 1 },
          ].map((step, i, arr) => (
            <View key={step.label} style={styles.progressStep}>
              <View style={styles.progressIndicator}>
                <View style={[styles.progressDot, {
                  backgroundColor: step.done ? "#1B6B3A" : step.active ? statusConfig.color : colors.border,
                }]}>
                  {step.done && <IconSymbol name="checkmark.circle.fill" size={12} color="#fff" />}
                  {step.active && !step.done && <View style={styles.activeDotInner} />}
                </View>
                {i < arr.length - 1 && (
                  <View style={[styles.progressLine, { backgroundColor: step.done ? "#1B6B3A" : colors.border }]} />
                )}
              </View>
              <Text style={[styles.progressLabel, {
                color: step.done ? "#1B6B3A" : step.active ? colors.foreground : colors.muted,
                fontWeight: step.active ? "700" : "400",
              }]}>{step.label}</Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        {order && (
          <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.orderTitle, { color: colors.foreground }]}>Order Summary</Text>
            {order.items.map((item, i) => (
              <View key={i} style={[styles.orderItem, i < order.items.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                <Text style={[styles.orderItemName, { color: colors.foreground }]}>{item.product.name}</Text>
                <Text style={[styles.orderItemQty, { color: colors.muted }]}>x{item.quantity}</Text>
              </View>
            ))}
            <View style={[styles.orderTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.orderTotalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.orderTotalValue, { color: "#1B6B3A" }]}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        {order && (
          <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="location.fill" size={18} color="#10B981" />
            <View style={styles.addressInfo}>
              <Text style={[styles.addressLabel, { color: colors.muted }]}>Delivering to</Text>
              <Text style={[styles.addressText, { color: colors.foreground }]}>{order.deliveryAddress}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  mapArea: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: "hidden" },
  mapContent: { padding: 20 },
  routeViz: { gap: 8 },
  markerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  marker: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  markerLabel: { fontSize: 13, fontWeight: "600" },
  routeLineContainer: { height: 40, justifyContent: "center", marginLeft: 16, paddingRight: 16 },
  routeTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  routeProgress: { height: "100%", borderRadius: 2 },
  driverOnRoute: { position: "absolute", top: 4, marginLeft: -14 },
  driverDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  coordsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  coordsText: { fontSize: 11 },
  etaBanner: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  etaLeft: { flex: 1 },
  etaLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  etaMessage: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2, lineHeight: 16 },
  etaRight: { alignItems: "center", marginLeft: 16 },
  etaTime: { color: "#fff", fontSize: 36, fontWeight: "800" },
  etaUnit: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", marginTop: -4 },
  driverCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  driverInfo: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  driverAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: "700" },
  driverVehicle: { fontSize: 13, marginTop: 1 },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  driverRating: { fontSize: 13, fontWeight: "600" },
  driverPlate: { fontSize: 12 },
  driverActions: { flexDirection: "row", gap: 10 },
  driverActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  driverActionText: { fontSize: 14, fontWeight: "600" },
  progressCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  progressTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  progressStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  progressIndicator: { alignItems: "center", width: 18 },
  progressDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  activeDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  progressLine: { width: 2, height: 18, marginVertical: 1 },
  progressLabel: { fontSize: 14, lineHeight: 18, paddingTop: 0 },
  orderCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  orderTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  orderItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  orderItemName: { fontSize: 14 },
  orderItemQty: { fontSize: 14 },
  orderTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, marginTop: 4 },
  orderTotalLabel: { fontSize: 15, fontWeight: "700" },
  orderTotalValue: { fontSize: 16, fontWeight: "800" },
  addressCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  addressText: { fontSize: 14, fontWeight: "500", marginTop: 2 },
});
