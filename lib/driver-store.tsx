import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DRIVER_KEY = "liquordash_driver";

// ─── Types ───────────────────────────────────────────────────────────

export interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarInitials: string;
  vehicleType: "car" | "motorcycle" | "bicycle" | "van";
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  licensePlate: string;
  driversLicense: string;
  insuranceNumber: string;
  rating: number;
  totalDeliveries: number;
  memberSince: string;
  isVerified: boolean;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface DeliveryJob {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  storeAddress: string;
  storeLocation: GeoCoordinate;
  deliveryAddress: string;
  deliveryLocation: GeoCoordinate;
  items: { name: string; quantity: number }[];
  itemCount: number;
  estimatedDistance: string;
  estimatedTime: string;
  basePay: number;
  tipAmount: number;
  totalPay: number;
  status: DeliveryJobStatus;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  specialInstructions?: string;
}

export type DeliveryJobStatus =
  | "available"
  | "accepted"
  | "arriving-store"
  | "at-store"
  | "picked-up"
  | "en-route"
  | "arriving"
  | "delivered"
  | "cancelled";

export interface DriverEarning {
  id: string;
  jobId: string;
  basePay: number;
  tipAmount: number;
  bonusAmount: number;
  totalEarned: number;
  date: string;
}

export interface DriverLocation {
  coordinate: GeoCoordinate;
  heading: number;
  speed: number;
  timestamp: string;
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalEarnings: number;
  totalDeliveries: number;
  averagePerDelivery: number;
  averageRating: number;
}

// ─── Constants ───────────────────────────────────────────────────────

export const VEHICLE_TYPES = [
  { value: "car" as const, label: "Car", icon: "🚗" },
  { value: "motorcycle" as const, label: "Motorcycle", icon: "🏍️" },
  { value: "bicycle" as const, label: "Bicycle", icon: "🚲" },
  { value: "van" as const, label: "Van", icon: "🚐" },
];

export const JOB_STATUS_LABELS: Record<DeliveryJobStatus, string> = {
  available: "Available",
  accepted: "Accepted",
  "arriving-store": "Heading to Store",
  "at-store": "At Store",
  "picked-up": "Picked Up",
  "en-route": "En Route to Customer",
  arriving: "Arriving",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const JOB_STATUS_COLORS: Record<DeliveryJobStatus, string> = {
  available: "#3B82F6",
  accepted: "#8B5CF6",
  "arriving-store": "#F59E0B",
  "at-store": "#F59E0B",
  "picked-up": "#10B981",
  "en-route": "#10B981",
  arriving: "#10B981",
  delivered: "#22C55E",
  cancelled: "#EF4444",
};

// Simulated delivery route waypoints (San Francisco area)
const SIMULATED_ROUTES: GeoCoordinate[][] = [
  [
    { latitude: 37.7749, longitude: -122.4194 },
    { latitude: 37.7755, longitude: -122.4180 },
    { latitude: 37.7762, longitude: -122.4165 },
    { latitude: 37.7770, longitude: -122.4150 },
    { latitude: 37.7778, longitude: -122.4135 },
    { latitude: 37.7785, longitude: -122.4120 },
    { latitude: 37.7792, longitude: -122.4105 },
    { latitude: 37.7800, longitude: -122.4090 },
    { latitude: 37.7808, longitude: -122.4075 },
    { latitude: 37.7815, longitude: -122.4060 },
  ],
  [
    { latitude: 37.7849, longitude: -122.4094 },
    { latitude: 37.7842, longitude: -122.4080 },
    { latitude: 37.7835, longitude: -122.4065 },
    { latitude: 37.7828, longitude: -122.4050 },
    { latitude: 37.7820, longitude: -122.4035 },
    { latitude: 37.7813, longitude: -122.4020 },
    { latitude: 37.7806, longitude: -122.4005 },
    { latitude: 37.7799, longitude: -122.3990 },
  ],
];

// Sample available jobs
export const SAMPLE_JOBS: DeliveryJob[] = [
  {
    id: "DJ-001",
    orderId: "LD-ABC123",
    customerName: "Sarah M.",
    customerPhone: "(415) 555-0142",
    storeName: "Downtown Spirits",
    storeAddress: "123 Market St, San Francisco, CA",
    storeLocation: { latitude: 37.7749, longitude: -122.4194 },
    deliveryAddress: "456 Mission St, Apt 12B, San Francisco, CA",
    deliveryLocation: { latitude: 37.7815, longitude: -122.4060 },
    items: [
      { name: "Maker's Mark Bourbon", quantity: 1 },
      { name: "Fever-Tree Tonic 4-Pack", quantity: 2 },
    ],
    itemCount: 3,
    estimatedDistance: "1.2 mi",
    estimatedTime: "15 min",
    basePay: 6.50,
    tipAmount: 4.00,
    totalPay: 10.50,
    status: "available",
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    specialInstructions: "Leave at door, ring doorbell",
  },
  {
    id: "DJ-002",
    orderId: "LD-DEF456",
    customerName: "James T.",
    customerPhone: "(415) 555-0198",
    storeName: "Vine & Barrel",
    storeAddress: "789 Valencia St, San Francisco, CA",
    storeLocation: { latitude: 37.7849, longitude: -122.4094 },
    deliveryAddress: "321 Folsom St, San Francisco, CA",
    deliveryLocation: { latitude: 37.7799, longitude: -122.3990 },
    items: [
      { name: "Grey Goose Vodka", quantity: 1 },
      { name: "Veuve Clicquot", quantity: 1 },
      { name: "Hendrick's Gin", quantity: 1 },
    ],
    itemCount: 3,
    estimatedDistance: "2.1 mi",
    estimatedTime: "22 min",
    basePay: 8.75,
    tipAmount: 7.00,
    totalPay: 15.75,
    status: "available",
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: "DJ-003",
    orderId: "LD-GHI789",
    customerName: "Emily R.",
    customerPhone: "(415) 555-0267",
    storeName: "The Whiskey Exchange",
    storeAddress: "555 Hayes St, San Francisco, CA",
    storeLocation: { latitude: 37.7762, longitude: -122.4230 },
    deliveryAddress: "888 Brannan St, San Francisco, CA",
    deliveryLocation: { latitude: 37.7730, longitude: -122.4010 },
    items: [
      { name: "Patrón Silver Tequila", quantity: 2 },
      { name: "White Claw Variety Pack", quantity: 1 },
    ],
    itemCount: 3,
    estimatedDistance: "1.8 mi",
    estimatedTime: "18 min",
    basePay: 7.25,
    tipAmount: 5.50,
    totalPay: 12.75,
    status: "available",
    createdAt: new Date().toISOString(),
  },
];

// Sample completed jobs for earnings
export const SAMPLE_EARNINGS: DriverEarning[] = [
  { id: "E-001", jobId: "DJ-100", basePay: 6.50, tipAmount: 4.00, bonusAmount: 0, totalEarned: 10.50, date: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "E-002", jobId: "DJ-101", basePay: 8.25, tipAmount: 6.00, bonusAmount: 2.00, totalEarned: 16.25, date: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "E-003", jobId: "DJ-102", basePay: 5.75, tipAmount: 3.50, bonusAmount: 0, totalEarned: 9.25, date: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "E-004", jobId: "DJ-103", basePay: 9.00, tipAmount: 8.00, bonusAmount: 3.00, totalEarned: 20.00, date: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "E-005", jobId: "DJ-104", basePay: 7.50, tipAmount: 5.00, bonusAmount: 0, totalEarned: 12.50, date: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: "E-006", jobId: "DJ-105", basePay: 6.00, tipAmount: 4.50, bonusAmount: 1.50, totalEarned: 12.00, date: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: "E-007", jobId: "DJ-106", basePay: 8.50, tipAmount: 7.00, bonusAmount: 0, totalEarned: 15.50, date: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: "E-008", jobId: "DJ-107", basePay: 7.00, tipAmount: 5.50, bonusAmount: 2.00, totalEarned: 14.50, date: new Date(Date.now() - 96 * 3600000).toISOString() },
];

export function createDefaultDriverProfile(): DriverProfile {
  return {
    id: `DRV-${Date.now().toString(36).toUpperCase()}`,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarInitials: "",
    vehicleType: "car",
    vehicleMake: "",
    vehicleModel: "",
    vehicleColor: "",
    licensePlate: "",
    driversLicense: "",
    insuranceNumber: "",
    rating: 4.8,
    totalDeliveries: 0,
    memberSince: new Date().toISOString(),
    isVerified: false,
  };
}

// ─── State ───────────────────────────────────────────────────────────

interface DriverState {
  isRegistered: boolean;
  isOnline: boolean;
  profile: DriverProfile;
  activeJob: DeliveryJob | null;
  availableJobs: DeliveryJob[];
  completedJobs: DeliveryJob[];
  earnings: DriverEarning[];
  currentLocation: DriverLocation;
  routeWaypoints: GeoCoordinate[];
  currentWaypointIndex: number;
}

type DriverAction =
  | { type: "SET_STATE"; state: Partial<DriverState> }
  | { type: "SET_REGISTERED"; isRegistered: boolean }
  | { type: "SET_ONLINE"; isOnline: boolean }
  | { type: "UPDATE_PROFILE"; profile: Partial<DriverProfile> }
  | { type: "ACCEPT_JOB"; job: DeliveryJob }
  | { type: "UPDATE_JOB_STATUS"; status: DeliveryJobStatus }
  | { type: "COMPLETE_JOB" }
  | { type: "CANCEL_JOB" }
  | { type: "UPDATE_LOCATION"; location: DriverLocation }
  | { type: "ADVANCE_WAYPOINT" }
  | { type: "ADD_EARNING"; earning: DriverEarning }
  | { type: "REFRESH_JOBS" };

const DEFAULT_LOCATION: DriverLocation = {
  coordinate: { latitude: 37.7749, longitude: -122.4194 },
  heading: 0,
  speed: 0,
  timestamp: new Date().toISOString(),
};

function driverReducer(state: DriverState, action: DriverAction): DriverState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.state };
    case "SET_REGISTERED":
      return { ...state, isRegistered: action.isRegistered };
    case "SET_ONLINE":
      return { ...state, isOnline: action.isOnline, availableJobs: action.isOnline ? SAMPLE_JOBS : [] };
    case "UPDATE_PROFILE": {
      const p = { ...state.profile, ...action.profile };
      p.avatarInitials = (p.firstName?.[0] || "") + (p.lastName?.[0] || "");
      return { ...state, profile: p };
    }
    case "ACCEPT_JOB": {
      const routeIdx = Math.floor(Math.random() * SIMULATED_ROUTES.length);
      return {
        ...state,
        activeJob: { ...action.job, status: "accepted", acceptedAt: new Date().toISOString() },
        availableJobs: state.availableJobs.filter((j) => j.id !== action.job.id),
        routeWaypoints: SIMULATED_ROUTES[routeIdx],
        currentWaypointIndex: 0,
      };
    }
    case "UPDATE_JOB_STATUS": {
      if (!state.activeJob) return state;
      const updated = { ...state.activeJob, status: action.status };
      if (action.status === "picked-up") updated.pickedUpAt = new Date().toISOString();
      return { ...state, activeJob: updated };
    }
    case "COMPLETE_JOB": {
      if (!state.activeJob) return state;
      const completed = { ...state.activeJob, status: "delivered" as const, deliveredAt: new Date().toISOString() };
      return {
        ...state,
        activeJob: null,
        completedJobs: [completed, ...state.completedJobs],
        profile: { ...state.profile, totalDeliveries: state.profile.totalDeliveries + 1 },
        routeWaypoints: [],
        currentWaypointIndex: 0,
      };
    }
    case "CANCEL_JOB": {
      if (!state.activeJob) return state;
      const cancelled = { ...state.activeJob, status: "cancelled" as const };
      return {
        ...state,
        activeJob: null,
        availableJobs: [...state.availableJobs, { ...cancelled, status: "available" as const }],
        routeWaypoints: [],
        currentWaypointIndex: 0,
      };
    }
    case "UPDATE_LOCATION":
      return { ...state, currentLocation: action.location };
    case "ADVANCE_WAYPOINT": {
      const nextIdx = Math.min(state.currentWaypointIndex + 1, state.routeWaypoints.length - 1);
      const coord = state.routeWaypoints[nextIdx] || state.currentLocation.coordinate;
      return {
        ...state,
        currentWaypointIndex: nextIdx,
        currentLocation: {
          coordinate: coord,
          heading: calculateHeading(state.currentLocation.coordinate, coord),
          speed: 25 + Math.random() * 15,
          timestamp: new Date().toISOString(),
        },
      };
    }
    case "ADD_EARNING":
      return { ...state, earnings: [action.earning, ...state.earnings] };
    case "REFRESH_JOBS":
      return { ...state, availableJobs: state.isOnline ? SAMPLE_JOBS.filter((j) => j.id !== state.activeJob?.id) : [] };
    default:
      return state;
  }
}

function calculateHeading(from: GeoCoordinate, to: GeoCoordinate): number {
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// ─── Context ─────────────────────────────────────────────────────────

interface DriverContextValue {
  isRegistered: boolean;
  isOnline: boolean;
  profile: DriverProfile;
  activeJob: DeliveryJob | null;
  availableJobs: DeliveryJob[];
  completedJobs: DeliveryJob[];
  earnings: DriverEarning[];
  currentLocation: DriverLocation;
  earningsSummary: EarningsSummary;
  routeWaypoints: GeoCoordinate[];
  currentWaypointIndex: number;
  register: (profile: Partial<DriverProfile>) => void;
  goOnline: () => void;
  goOffline: () => void;
  updateProfile: (updates: Partial<DriverProfile>) => void;
  acceptJob: (job: DeliveryJob) => void;
  updateJobStatus: (status: DeliveryJobStatus) => void;
  completeJob: () => void;
  cancelJob: () => void;
  advanceSimulation: () => void;
}

const DriverContext = createContext<DriverContextValue | null>(null);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, {
    isRegistered: false,
    isOnline: false,
    profile: createDefaultDriverProfile(),
    activeJob: null,
    availableJobs: [],
    completedJobs: [],
    earnings: SAMPLE_EARNINGS,
    currentLocation: DEFAULT_LOCATION,
    routeWaypoints: [],
    currentWaypointIndex: 0,
  });

  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DRIVER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch({ type: "SET_STATE", state: { isRegistered: parsed.isRegistered, profile: parsed.profile, earnings: parsed.earnings || SAMPLE_EARNINGS, completedJobs: parsed.completedJobs || [] } });
        }
      } catch {}
    })();
  }, []);

  // Save to storage
  useEffect(() => {
    AsyncStorage.setItem(DRIVER_KEY, JSON.stringify({
      isRegistered: state.isRegistered,
      profile: state.profile,
      earnings: state.earnings,
      completedJobs: state.completedJobs,
    })).catch(() => {});
  }, [state.isRegistered, state.profile, state.earnings, state.completedJobs]);

  // GPS simulation - advance waypoints when active job
  useEffect(() => {
    if (state.activeJob && state.routeWaypoints.length > 0 && state.activeJob.status !== "delivered" && state.activeJob.status !== "at-store") {
      simulationRef.current = setInterval(() => {
        dispatch({ type: "ADVANCE_WAYPOINT" });
      }, 3000);
      return () => { if (simulationRef.current) clearInterval(simulationRef.current); };
    }
    return () => { if (simulationRef.current) clearInterval(simulationRef.current); };
  }, [state.activeJob?.id, state.activeJob?.status, state.routeWaypoints.length]);

  const register = useCallback((profile: Partial<DriverProfile>) => {
    dispatch({ type: "UPDATE_PROFILE", profile });
    dispatch({ type: "SET_REGISTERED", isRegistered: true });
  }, []);

  const goOnline = useCallback(() => dispatch({ type: "SET_ONLINE", isOnline: true }), []);
  const goOffline = useCallback(() => dispatch({ type: "SET_ONLINE", isOnline: false }), []);
  const updateProfile = useCallback((updates: Partial<DriverProfile>) => dispatch({ type: "UPDATE_PROFILE", profile: updates }), []);
  const acceptJob = useCallback((job: DeliveryJob) => dispatch({ type: "ACCEPT_JOB", job }), []);

  const updateJobStatus = useCallback((status: DeliveryJobStatus) => dispatch({ type: "UPDATE_JOB_STATUS", status }), []);

  const completeJob = useCallback(() => {
    if (state.activeJob) {
      const earning: DriverEarning = {
        id: `E-${Date.now().toString(36)}`,
        jobId: state.activeJob.id,
        basePay: state.activeJob.basePay,
        tipAmount: state.activeJob.tipAmount,
        bonusAmount: Math.random() > 0.7 ? Math.round(Math.random() * 3 * 100) / 100 : 0,
        totalEarned: state.activeJob.totalPay,
        date: new Date().toISOString(),
      };
      dispatch({ type: "ADD_EARNING", earning });
    }
    dispatch({ type: "COMPLETE_JOB" });
  }, [state.activeJob]);

  const cancelJob = useCallback(() => dispatch({ type: "CANCEL_JOB" }), []);
  const advanceSimulation = useCallback(() => dispatch({ type: "ADVANCE_WAYPOINT" }), []);

  const earningsSummary = useMemo<EarningsSummary>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - (now.getDay() * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const today = state.earnings.filter((e) => new Date(e.date).getTime() >= todayStart).reduce((s, e) => s + e.totalEarned, 0);
    const thisWeek = state.earnings.filter((e) => new Date(e.date).getTime() >= weekStart).reduce((s, e) => s + e.totalEarned, 0);
    const thisMonth = state.earnings.filter((e) => new Date(e.date).getTime() >= monthStart).reduce((s, e) => s + e.totalEarned, 0);
    const totalEarnings = state.earnings.reduce((s, e) => s + e.totalEarned, 0);
    const totalDeliveries = state.earnings.length;

    return {
      today,
      thisWeek,
      thisMonth,
      totalEarnings,
      totalDeliveries,
      averagePerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
      averageRating: state.profile.rating,
    };
  }, [state.earnings, state.profile.rating]);

  const value = useMemo<DriverContextValue>(() => ({
    isRegistered: state.isRegistered,
    isOnline: state.isOnline,
    profile: state.profile,
    activeJob: state.activeJob,
    availableJobs: state.availableJobs,
    completedJobs: state.completedJobs,
    earnings: state.earnings,
    currentLocation: state.currentLocation,
    earningsSummary,
    routeWaypoints: state.routeWaypoints,
    currentWaypointIndex: state.currentWaypointIndex,
    register,
    goOnline,
    goOffline,
    updateProfile,
    acceptJob,
    updateJobStatus,
    completeJob,
    cancelJob,
    advanceSimulation,
  }), [state, earningsSummary, register, goOnline, goOffline, updateProfile, acceptJob, updateJobStatus, completeJob, cancelJob, advanceSimulation]);

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver(): DriverContextValue {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver must be used within DriverProvider");
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getDeliverySteps(status: DeliveryJobStatus): { label: string; completed: boolean; active: boolean }[] {
  const steps = [
    { key: "accepted", label: "Accepted" },
    { key: "arriving-store", label: "Heading to Store" },
    { key: "at-store", label: "At Store" },
    { key: "picked-up", label: "Picked Up" },
    { key: "en-route", label: "En Route" },
    { key: "arriving", label: "Arriving" },
    { key: "delivered", label: "Delivered" },
  ];
  const statusOrder = steps.map((s) => s.key);
  const currentIdx = statusOrder.indexOf(status);
  return steps.map((step, i) => ({
    label: step.label,
    completed: i < currentIdx,
    active: i === currentIdx,
  }));
}
