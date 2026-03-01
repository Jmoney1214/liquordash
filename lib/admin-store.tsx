import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────

export type AdminRole = "super_admin" | "operations" | "support" | "finance";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarInitials: string;
}

// ─── Store Application Review ────────────────────────────────────────

export type AppReviewStatus = "pending" | "under_review" | "approved" | "rejected";

export interface StoreApplicationReview {
  id: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  businessType: "independent" | "chain" | "franchise";
  licenseType: string;
  licenseNumber: string;
  licenseExpiry: string;
  supportsExpress: boolean;
  supportsShipping: boolean;
  status: AppReviewStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes: string;
}

// ─── Driver Approval ─────────────────────────────────────────────────

export type DriverApprovalStatus = "pending" | "approved" | "suspended" | "rejected";

export interface DriverApproval {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate: string;
  driversLicense: string;
  insuranceNumber: string;
  rating: number;
  totalDeliveries: number;
  status: DriverApprovalStatus;
  appliedAt: string;
  reviewedAt?: string;
  suspensionReason?: string;
}

// ─── Platform Order ──────────────────────────────────────────────────

export type PlatformOrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready"
  | "out_for_delivery" | "delivered" | "cancelled" | "refunded";

export interface PlatformOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  storeId: string;
  driverName?: string;
  driverId?: string;
  deliveryMode: "express" | "shipping";
  status: PlatformOrderStatus;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  commission: number;
  createdAt: string;
  deliveredAt?: string;
  deliveryAddress: string;
  isGift: boolean;
}

// ─── Platform User ───────────────────────────────────────────────────

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  isVerified: boolean;
  status: "active" | "suspended" | "deactivated";
  rewardsTier: "bronze" | "silver" | "gold" | "platinum";
}

// ─── Platform Analytics ──────────────────────────────────────────────

export interface PlatformMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalStores: number;
  totalDrivers: number;
  activeOrders: number;
  avgOrderValue: number;
  platformCommission: number;
  // Period comparisons
  revenueGrowth: number;      // percentage
  orderGrowth: number;        // percentage
  customerGrowth: number;     // percentage
  // Today
  todayRevenue: number;
  todayOrders: number;
  todayNewCustomers: number;
  // This week
  weekRevenue: number;
  weekOrders: number;
  // This month
  monthRevenue: number;
  monthOrders: number;
}

export interface RevenueDataPoint {
  label: string;
  revenue: number;
  orders: number;
  commission: number;
}

export interface PlatformSettings {
  commissionRate: number;       // percentage (e.g. 15)
  expressDeliveryFee: number;
  shippingFee: number;
  minimumOrderAmount: number;
  driverBasePay: number;
  driverPerMilePay: number;
  promoCodeEnabled: boolean;
  maintenanceMode: boolean;
}

// ─── Sample Data ─────────────────────────────────────────────────────

export const SAMPLE_STORE_APPLICATIONS: StoreApplicationReview[] = [
  {
    id: "APP-001",
    businessName: "Barrel & Vine Spirits",
    ownerName: "James Mitchell",
    ownerEmail: "james@barrelvine.com",
    ownerPhone: "(415) 555-0198",
    storeAddress: "789 Market St",
    storeCity: "San Francisco",
    storeState: "CA",
    storeZip: "94103",
    businessType: "independent",
    licenseType: "retail",
    licenseNumber: "CA-LIQ-2024-8891",
    licenseExpiry: "2027-03-15",
    supportsExpress: true,
    supportsShipping: true,
    status: "pending",
    submittedAt: "2026-02-28T14:30:00Z",
    notes: "",
  },
  {
    id: "APP-002",
    businessName: "Metro Wine & Spirits",
    ownerName: "Sarah Chen",
    ownerEmail: "sarah@metrowine.com",
    ownerPhone: "(212) 555-0234",
    storeAddress: "321 Broadway",
    storeCity: "New York",
    storeState: "NY",
    storeZip: "10013",
    businessType: "chain",
    licenseType: "retail",
    licenseNumber: "NY-LIQ-2025-4412",
    licenseExpiry: "2027-06-30",
    supportsExpress: true,
    supportsShipping: false,
    status: "pending",
    submittedAt: "2026-02-27T09:15:00Z",
    notes: "",
  },
  {
    id: "APP-003",
    businessName: "Heritage Distillers",
    ownerName: "Robert Williams",
    ownerEmail: "rob@heritagedist.com",
    ownerPhone: "(503) 555-0167",
    storeAddress: "555 Pearl District Ave",
    storeCity: "Portland",
    storeState: "OR",
    storeZip: "97209",
    businessType: "independent",
    licenseType: "manufacturer",
    licenseNumber: "OR-DST-2024-1123",
    licenseExpiry: "2026-12-31",
    supportsExpress: false,
    supportsShipping: true,
    status: "approved",
    submittedAt: "2026-02-15T11:00:00Z",
    reviewedAt: "2026-02-17T16:45:00Z",
    reviewedBy: "Admin",
    notes: "Strong application, verified license.",
  },
  {
    id: "APP-004",
    businessName: "Quick Liquor Mart",
    ownerName: "David Park",
    ownerEmail: "david@quickliquor.com",
    ownerPhone: "(305) 555-0345",
    storeAddress: "100 Ocean Drive",
    storeCity: "Miami",
    storeState: "FL",
    storeZip: "33139",
    businessType: "franchise",
    licenseType: "retail",
    licenseNumber: "FL-LIQ-2025-7789",
    licenseExpiry: "2026-04-01",
    supportsExpress: true,
    supportsShipping: true,
    status: "rejected",
    submittedAt: "2026-02-10T08:00:00Z",
    reviewedAt: "2026-02-12T10:30:00Z",
    reviewedBy: "Admin",
    rejectionReason: "License expiring within 60 days. Please renew and reapply.",
    notes: "License too close to expiry.",
  },
];

export const SAMPLE_DRIVER_APPROVALS: DriverApproval[] = [
  {
    id: "DRV-A01",
    firstName: "Marcus",
    lastName: "Johnson",
    email: "marcus.j@email.com",
    phone: "(646) 555-0189",
    vehicleType: "car",
    vehicleMake: "Toyota",
    vehicleModel: "Camry 2023",
    licensePlate: "ABC-1234",
    driversLicense: "NY-DL-9988776",
    insuranceNumber: "INS-2024-55667",
    rating: 0,
    totalDeliveries: 0,
    status: "pending",
    appliedAt: "2026-02-28T10:00:00Z",
  },
  {
    id: "DRV-A02",
    firstName: "Elena",
    lastName: "Rodriguez",
    email: "elena.r@email.com",
    phone: "(415) 555-0276",
    vehicleType: "motorcycle",
    vehicleMake: "Honda",
    vehicleModel: "CB300R",
    licensePlate: "MC-5678",
    driversLicense: "CA-DL-1122334",
    insuranceNumber: "INS-2024-88990",
    rating: 0,
    totalDeliveries: 0,
    status: "pending",
    appliedAt: "2026-02-27T15:30:00Z",
  },
  {
    id: "DRV-A03",
    firstName: "Tyler",
    lastName: "Brooks",
    email: "tyler.b@email.com",
    phone: "(312) 555-0198",
    vehicleType: "car",
    vehicleMake: "Honda",
    vehicleModel: "Civic 2024",
    licensePlate: "IL-9012",
    driversLicense: "IL-DL-5566778",
    insuranceNumber: "INS-2025-11223",
    rating: 4.9,
    totalDeliveries: 156,
    status: "approved",
    appliedAt: "2026-01-15T09:00:00Z",
    reviewedAt: "2026-01-16T14:00:00Z",
  },
  {
    id: "DRV-A04",
    firstName: "Aisha",
    lastName: "Patel",
    email: "aisha.p@email.com",
    phone: "(213) 555-0345",
    vehicleType: "car",
    vehicleMake: "Hyundai",
    vehicleModel: "Elantra 2022",
    licensePlate: "CA-3456",
    driversLicense: "CA-DL-9900112",
    insuranceNumber: "INS-2024-44556",
    rating: 4.7,
    totalDeliveries: 89,
    status: "suspended",
    appliedAt: "2025-12-01T08:00:00Z",
    reviewedAt: "2025-12-02T11:00:00Z",
    suspensionReason: "Multiple customer complaints about late deliveries.",
  },
];

export const SAMPLE_PLATFORM_ORDERS: PlatformOrder[] = [
  {
    id: "ORD-10001",
    customerId: "C-001",
    customerName: "Alex Thompson",
    customerEmail: "alex.t@email.com",
    storeName: "Downtown Spirits",
    storeId: "store-1",
    driverName: "Tyler Brooks",
    driverId: "DRV-A03",
    deliveryMode: "express",
    status: "out_for_delivery",
    itemCount: 3,
    subtotal: 89.97,
    deliveryFee: 5.99,
    platformFee: 2.99,
    total: 98.95,
    commission: 13.50,
    createdAt: "2026-03-01T11:30:00Z",
    deliveryAddress: "123 Park Ave, New York, NY 10017",
    isGift: false,
  },
  {
    id: "ORD-10002",
    customerId: "C-002",
    customerName: "Jessica Liu",
    customerEmail: "jessica.l@email.com",
    storeName: "Vine & Barrel",
    storeId: "store-2",
    deliveryMode: "shipping",
    status: "preparing",
    itemCount: 2,
    subtotal: 145.00,
    deliveryFee: 12.99,
    platformFee: 2.99,
    total: 160.98,
    commission: 21.75,
    createdAt: "2026-03-01T10:15:00Z",
    deliveryAddress: "456 Elm St, Chicago, IL 60601",
    isGift: true,
  },
  {
    id: "ORD-10003",
    customerId: "C-003",
    customerName: "Michael Brown",
    customerEmail: "michael.b@email.com",
    storeName: "Downtown Spirits",
    storeId: "store-1",
    driverName: "Marcus Johnson",
    driverId: "DRV-A01",
    deliveryMode: "express",
    status: "delivered",
    itemCount: 1,
    subtotal: 42.99,
    deliveryFee: 5.99,
    platformFee: 2.99,
    total: 51.97,
    commission: 6.45,
    createdAt: "2026-02-28T18:00:00Z",
    deliveredAt: "2026-02-28T18:45:00Z",
    deliveryAddress: "789 Broadway, New York, NY 10003",
    isGift: false,
  },
  {
    id: "ORD-10004",
    customerId: "C-004",
    customerName: "Samantha Davis",
    customerEmail: "sam.d@email.com",
    storeName: "The Whiskey Exchange",
    storeId: "store-3",
    deliveryMode: "shipping",
    status: "confirmed",
    itemCount: 4,
    subtotal: 234.96,
    deliveryFee: 12.99,
    platformFee: 2.99,
    total: 250.94,
    commission: 35.24,
    createdAt: "2026-03-01T09:00:00Z",
    deliveryAddress: "321 Oak Lane, Austin, TX 78701",
    isGift: false,
  },
  {
    id: "ORD-10005",
    customerId: "C-005",
    customerName: "Daniel Kim",
    customerEmail: "daniel.k@email.com",
    storeName: "Vine & Barrel",
    storeId: "store-2",
    driverName: "Elena Rodriguez",
    driverId: "DRV-A02",
    deliveryMode: "express",
    status: "pending",
    itemCount: 2,
    subtotal: 67.98,
    deliveryFee: 5.99,
    platformFee: 2.99,
    total: 76.96,
    commission: 10.20,
    createdAt: "2026-03-01T12:00:00Z",
    deliveryAddress: "555 Mission St, San Francisco, CA 94105",
    isGift: false,
  },
  {
    id: "ORD-10006",
    customerId: "C-006",
    customerName: "Rachel Green",
    customerEmail: "rachel.g@email.com",
    storeName: "Downtown Spirits",
    storeId: "store-1",
    deliveryMode: "express",
    status: "cancelled",
    itemCount: 1,
    subtotal: 29.99,
    deliveryFee: 5.99,
    platformFee: 2.99,
    total: 38.97,
    commission: 4.50,
    createdAt: "2026-02-28T15:00:00Z",
    deliveryAddress: "100 Central Park West, New York, NY 10023",
    isGift: false,
  },
];

export const SAMPLE_PLATFORM_USERS: PlatformUser[] = [
  { id: "C-001", name: "Alex Thompson", email: "alex.t@email.com", phone: "(646) 555-0101", joinedAt: "2025-06-15", totalOrders: 24, totalSpent: 1245.67, isVerified: true, status: "active", rewardsTier: "gold" },
  { id: "C-002", name: "Jessica Liu", email: "jessica.l@email.com", phone: "(312) 555-0202", joinedAt: "2025-09-01", totalOrders: 12, totalSpent: 678.90, isVerified: true, status: "active", rewardsTier: "silver" },
  { id: "C-003", name: "Michael Brown", email: "michael.b@email.com", phone: "(212) 555-0303", joinedAt: "2025-11-20", totalOrders: 8, totalSpent: 389.45, isVerified: true, status: "active", rewardsTier: "bronze" },
  { id: "C-004", name: "Samantha Davis", email: "sam.d@email.com", phone: "(512) 555-0404", joinedAt: "2026-01-05", totalOrders: 15, totalSpent: 1890.23, isVerified: true, status: "active", rewardsTier: "platinum" },
  { id: "C-005", name: "Daniel Kim", email: "daniel.k@email.com", phone: "(415) 555-0505", joinedAt: "2026-02-10", totalOrders: 3, totalSpent: 156.78, isVerified: false, status: "active", rewardsTier: "bronze" },
  { id: "C-006", name: "Rachel Green", email: "rachel.g@email.com", phone: "(212) 555-0606", joinedAt: "2025-08-22", totalOrders: 18, totalSpent: 945.12, isVerified: true, status: "suspended", rewardsTier: "gold" },
];

export const SAMPLE_METRICS: PlatformMetrics = {
  totalRevenue: 287456.78,
  totalOrders: 3842,
  totalCustomers: 1256,
  totalStores: 28,
  totalDrivers: 64,
  activeOrders: 18,
  avgOrderValue: 74.82,
  platformCommission: 43118.52,
  revenueGrowth: 23.5,
  orderGrowth: 18.2,
  customerGrowth: 31.4,
  todayRevenue: 4567.89,
  todayOrders: 62,
  todayNewCustomers: 8,
  weekRevenue: 28945.67,
  weekOrders: 412,
  monthRevenue: 98234.56,
  monthOrders: 1345,
};

export const SAMPLE_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "Mon", revenue: 3245, orders: 48, commission: 487 },
  { label: "Tue", revenue: 4123, orders: 56, commission: 619 },
  { label: "Wed", revenue: 3890, orders: 52, commission: 584 },
  { label: "Thu", revenue: 4567, orders: 61, commission: 685 },
  { label: "Fri", revenue: 6234, orders: 82, commission: 935 },
  { label: "Sat", revenue: 7890, orders: 98, commission: 1184 },
  { label: "Sun", revenue: 5432, orders: 71, commission: 815 },
];

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  commissionRate: 15,
  expressDeliveryFee: 5.99,
  shippingFee: 12.99,
  minimumOrderAmount: 20,
  driverBasePay: 4.50,
  driverPerMilePay: 0.65,
  promoCodeEnabled: true,
  maintenanceMode: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────

export function formatAdminCurrency(amount: number): string {
  return "$" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function getTimeAgoAdmin(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const ORDER_STATUS_LABELS: Record<PlatformOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<PlatformOrderStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  preparing: "#8B5CF6",
  ready: "#10B981",
  out_for_delivery: "#0EA5E9",
  delivered: "#22C55E",
  cancelled: "#EF4444",
  refunded: "#6B7280",
};

export const APP_REVIEW_STATUS_COLORS: Record<AppReviewStatus, string> = {
  pending: "#F59E0B",
  under_review: "#3B82F6",
  approved: "#22C55E",
  rejected: "#EF4444",
};

export const DRIVER_STATUS_COLORS: Record<DriverApprovalStatus, string> = {
  pending: "#F59E0B",
  approved: "#22C55E",
  suspended: "#EF4444",
  rejected: "#6B7280",
};

// ─── State ───────────────────────────────────────────────────────────

interface AdminState {
  isAdmin: boolean;
  adminUser: AdminUser;
  storeApplications: StoreApplicationReview[];
  driverApprovals: DriverApproval[];
  platformOrders: PlatformOrder[];
  platformUsers: PlatformUser[];
  metrics: PlatformMetrics;
  revenueData: RevenueDataPoint[];
  settings: PlatformSettings;
}

type AdminAction =
  | { type: "SET_ADMIN"; isAdmin: boolean }
  | { type: "UPDATE_APP_STATUS"; appId: string; status: AppReviewStatus; reason?: string }
  | { type: "UPDATE_DRIVER_STATUS"; driverId: string; status: DriverApprovalStatus; reason?: string }
  | { type: "UPDATE_ORDER_STATUS"; orderId: string; status: PlatformOrderStatus }
  | { type: "UPDATE_USER_STATUS"; userId: string; status: "active" | "suspended" | "deactivated" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<PlatformSettings> };

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case "SET_ADMIN":
      return { ...state, isAdmin: action.isAdmin };
    case "UPDATE_APP_STATUS":
      return {
        ...state,
        storeApplications: state.storeApplications.map((app) =>
          app.id === action.appId
            ? {
                ...app,
                status: action.status,
                reviewedAt: new Date().toISOString(),
                reviewedBy: state.adminUser.name,
                ...(action.reason ? { rejectionReason: action.reason } : {}),
              }
            : app
        ),
      };
    case "UPDATE_DRIVER_STATUS":
      return {
        ...state,
        driverApprovals: state.driverApprovals.map((d) =>
          d.id === action.driverId
            ? {
                ...d,
                status: action.status,
                reviewedAt: new Date().toISOString(),
                ...(action.reason ? { suspensionReason: action.reason } : {}),
              }
            : d
        ),
      };
    case "UPDATE_ORDER_STATUS":
      return {
        ...state,
        platformOrders: state.platformOrders.map((o) =>
          o.id === action.orderId
            ? { ...o, status: action.status, ...(action.status === "delivered" ? { deliveredAt: new Date().toISOString() } : {}) }
            : o
        ),
      };
    case "UPDATE_USER_STATUS":
      return {
        ...state,
        platformUsers: state.platformUsers.map((u) =>
          u.id === action.userId ? { ...u, status: action.status } : u
        ),
      };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────

interface AdminContextValue {
  isAdmin: boolean;
  adminUser: AdminUser;
  storeApplications: StoreApplicationReview[];
  driverApprovals: DriverApproval[];
  platformOrders: PlatformOrder[];
  platformUsers: PlatformUser[];
  metrics: PlatformMetrics;
  revenueData: RevenueDataPoint[];
  settings: PlatformSettings;
  // Computed
  pendingStoreApps: number;
  pendingDriverApps: number;
  activeOrderCount: number;
  // Actions
  enableAdmin: () => void;
  approveStoreApp: (appId: string) => void;
  rejectStoreApp: (appId: string, reason: string) => void;
  approveDriver: (driverId: string) => void;
  suspendDriver: (driverId: string, reason: string) => void;
  rejectDriver: (driverId: string, reason: string) => void;
  reinstateDriver: (driverId: string) => void;
  updateOrderStatus: (orderId: string, status: PlatformOrderStatus) => void;
  suspendUser: (userId: string) => void;
  activateUser: (userId: string) => void;
  updateSettings: (settings: Partial<PlatformSettings>) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const initialState: AdminState = {
  isAdmin: false,
  adminUser: {
    id: "ADMIN-001",
    name: "Admin User",
    email: "admin@liquordash.com",
    role: "super_admin",
    avatarInitials: "AD",
  },
  storeApplications: SAMPLE_STORE_APPLICATIONS,
  driverApprovals: SAMPLE_DRIVER_APPROVALS,
  platformOrders: SAMPLE_PLATFORM_ORDERS,
  platformUsers: SAMPLE_PLATFORM_USERS,
  metrics: SAMPLE_METRICS,
  revenueData: SAMPLE_REVENUE_DATA,
  settings: DEFAULT_PLATFORM_SETTINGS,
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  const enableAdmin = useCallback(() => dispatch({ type: "SET_ADMIN", isAdmin: true }), []);
  const approveStoreApp = useCallback((appId: string) => dispatch({ type: "UPDATE_APP_STATUS", appId, status: "approved" }), []);
  const rejectStoreApp = useCallback((appId: string, reason: string) => dispatch({ type: "UPDATE_APP_STATUS", appId, status: "rejected", reason }), []);
  const approveDriver = useCallback((driverId: string) => dispatch({ type: "UPDATE_DRIVER_STATUS", driverId, status: "approved" }), []);
  const suspendDriver = useCallback((driverId: string, reason: string) => dispatch({ type: "UPDATE_DRIVER_STATUS", driverId, status: "suspended", reason }), []);
  const rejectDriver = useCallback((driverId: string, reason: string) => dispatch({ type: "UPDATE_DRIVER_STATUS", driverId, status: "rejected", reason }), []);
  const reinstateDriver = useCallback((driverId: string) => dispatch({ type: "UPDATE_DRIVER_STATUS", driverId, status: "approved" }), []);
  const updateOrderStatus = useCallback((orderId: string, status: PlatformOrderStatus) => dispatch({ type: "UPDATE_ORDER_STATUS", orderId, status }), []);
  const suspendUser = useCallback((userId: string) => dispatch({ type: "UPDATE_USER_STATUS", userId, status: "suspended" }), []);
  const activateUser = useCallback((userId: string) => dispatch({ type: "UPDATE_USER_STATUS", userId, status: "active" }), []);
  const updateSettings = useCallback((settings: Partial<PlatformSettings>) => dispatch({ type: "UPDATE_SETTINGS", settings }), []);

  const pendingStoreApps = useMemo(() => state.storeApplications.filter((a) => a.status === "pending").length, [state.storeApplications]);
  const pendingDriverApps = useMemo(() => state.driverApprovals.filter((d) => d.status === "pending").length, [state.driverApprovals]);
  const activeOrderCount = useMemo(() => state.platformOrders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length, [state.platformOrders]);

  const value: AdminContextValue = {
    ...state,
    pendingStoreApps,
    pendingDriverApps,
    activeOrderCount,
    enableAdmin,
    approveStoreApp,
    rejectStoreApp,
    approveDriver,
    suspendDriver,
    rejectDriver,
    reinstateDriver,
    updateOrderStatus,
    suspendUser,
    activateUser,
    updateSettings,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
