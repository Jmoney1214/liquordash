// Store Partner data models and types

import { Category, Product, Order, OrderStatus, DeliveryMode } from "./data";

// ─── Application & Onboarding ───────────────────────────────────────────

export type ApplicationStatus = "draft" | "submitted" | "under-review" | "approved" | "rejected";

export type LicenseType = "retail" | "wholesale" | "manufacturer" | "distributor";

export interface StoreApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  // Step 1: Business Info
  businessName: string;
  businessType: "independent" | "chain" | "franchise";
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ein: string; // Employer Identification Number
  // Step 2: Store Details
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  storePhone: string;
  storeWebsite: string;
  // Step 3: Licensing
  licenseType: LicenseType;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  // Step 4: Operations
  operatingHours: OperatingHours;
  supportsExpress: boolean;
  supportsShipping: boolean;
  expressDeliveryRadius: number; // miles
  averageInventorySize: string;
  // Step 5: Payment
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: "checking" | "savings";
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "22:00"
  closed: boolean;
}

// ─── Store Profile (after approval) ─────────────────────────────────────

export interface StoreProfile {
  id: string;
  applicationId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  operatingHours: OperatingHours;
  supportsExpress: boolean;
  supportsShipping: boolean;
  expressDeliveryRadius: number;
  isActive: boolean;
  joinedAt: string;
  // Metrics
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  acceptanceRate: number;
  averagePrepTime: number; // minutes
}

// ─── Store Inventory ────────────────────────────────────────────────────

export interface StoreInventoryItem {
  id: string;
  storeId: string;
  productId: string;
  product: Product;
  inStock: boolean;
  stockQuantity: number;
  storePrice: number; // store can set their own price
  expressAvailable: boolean;
  shippingAvailable: boolean;
  lastUpdated: string;
}

// ─── Store Orders ───────────────────────────────────────────────────────

export type StoreOrderStatus =
  | "pending"       // new order, waiting for store to accept
  | "accepted"      // store accepted, preparing
  | "preparing"     // actively being prepared
  | "ready"         // ready for pickup/handoff to driver
  | "picked-up"     // driver picked up (express)
  | "shipped"       // shipped (shipping mode)
  | "completed"     // delivered to customer
  | "rejected"      // store rejected the order
  | "cancelled";    // cancelled

export interface StoreOrder {
  id: string;
  orderId: string;      // customer-facing order ID
  storeId: string;
  customerName: string;
  customerAddress: string;
  deliveryMode: DeliveryMode;
  items: StoreOrderItem[];
  subtotal: number;
  commission: number;    // platform commission
  storePayout: number;   // what store receives
  status: StoreOrderStatus;
  createdAt: string;
  acceptedAt?: string;
  preparedAt?: string;
  completedAt?: string;
  estimatedPrepTime: number; // minutes
  specialInstructions?: string;
  isGiftOrder: boolean;
}

export interface StoreOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

// ─── Store Metrics / Dashboard ──────────────────────────────────────────

export interface StoreDashboardMetrics {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  weeklyOrders: number;
  weeklyRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  averageRating: number;
  acceptanceRate: number;
}

// ─── Sample Store Data ──────────────────────────────────────────────────

export const SAMPLE_STORES: StoreProfile[] = [
  {
    id: "store-1",
    applicationId: "app-1",
    name: "Downtown Spirits",
    description: "Premium liquor store in the heart of downtown. Family-owned since 1985 with an extensive selection of fine wines, craft spirits, and rare bottles.",
    address: "456 Main Street",
    city: "New York",
    state: "NY",
    zip: "10001",
    phone: "(212) 555-0123",
    email: "info@downtownspirits.com",
    website: "www.downtownspirits.com",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400",
    rating: 4.7,
    reviewCount: 342,
    operatingHours: {
      monday: { open: "10:00", close: "22:00", closed: false },
      tuesday: { open: "10:00", close: "22:00", closed: false },
      wednesday: { open: "10:00", close: "22:00", closed: false },
      thursday: { open: "10:00", close: "22:00", closed: false },
      friday: { open: "10:00", close: "23:00", closed: false },
      saturday: { open: "10:00", close: "23:00", closed: false },
      sunday: { open: "12:00", close: "20:00", closed: false },
    },
    supportsExpress: true,
    supportsShipping: true,
    expressDeliveryRadius: 5,
    isActive: true,
    joinedAt: "2024-01-15T00:00:00Z",
    totalOrders: 1247,
    totalRevenue: 89432.50,
    averageRating: 4.7,
    acceptanceRate: 96.2,
    averagePrepTime: 12,
  },
  {
    id: "store-2",
    applicationId: "app-2",
    name: "Vine & Barrel",
    description: "Curated wine and spirits boutique specializing in organic and biodynamic wines, small-batch whiskeys, and artisanal cocktail ingredients.",
    address: "789 Oak Avenue",
    city: "Brooklyn",
    state: "NY",
    zip: "11201",
    phone: "(718) 555-0456",
    email: "hello@vineandbarrel.com",
    website: "www.vineandbarrel.com",
    imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=400",
    rating: 4.9,
    reviewCount: 218,
    operatingHours: {
      monday: { open: "11:00", close: "21:00", closed: false },
      tuesday: { open: "11:00", close: "21:00", closed: false },
      wednesday: { open: "11:00", close: "21:00", closed: false },
      thursday: { open: "11:00", close: "22:00", closed: false },
      friday: { open: "11:00", close: "22:00", closed: false },
      saturday: { open: "10:00", close: "22:00", closed: false },
      sunday: { open: "12:00", close: "19:00", closed: false },
    },
    supportsExpress: true,
    supportsShipping: false,
    expressDeliveryRadius: 3,
    isActive: true,
    joinedAt: "2024-03-20T00:00:00Z",
    totalOrders: 856,
    totalRevenue: 67890.25,
    averageRating: 4.9,
    acceptanceRate: 98.5,
    averagePrepTime: 8,
  },
  {
    id: "store-3",
    applicationId: "app-3",
    name: "The Whiskey Exchange",
    description: "Specialist whiskey retailer with over 500 bottles from Scotland, Ireland, Japan, and the USA. Expert staff and tasting events.",
    address: "321 Bourbon Lane",
    city: "Manhattan",
    state: "NY",
    zip: "10013",
    phone: "(212) 555-0789",
    email: "orders@whiskeyexchange.com",
    website: "www.whiskeyexchange.com",
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400",
    rating: 4.8,
    reviewCount: 567,
    operatingHours: {
      monday: { open: "10:00", close: "21:00", closed: false },
      tuesday: { open: "10:00", close: "21:00", closed: false },
      wednesday: { open: "10:00", close: "21:00", closed: false },
      thursday: { open: "10:00", close: "22:00", closed: false },
      friday: { open: "10:00", close: "23:00", closed: false },
      saturday: { open: "09:00", close: "23:00", closed: false },
      sunday: { open: "11:00", close: "20:00", closed: false },
    },
    supportsExpress: true,
    supportsShipping: true,
    expressDeliveryRadius: 4,
    isActive: true,
    joinedAt: "2024-02-10T00:00:00Z",
    totalOrders: 2134,
    totalRevenue: 245678.00,
    averageRating: 4.8,
    acceptanceRate: 97.1,
    averagePrepTime: 10,
  },
];

// ─── Sample Store Orders ────────────────────────────────────────────────

export const SAMPLE_STORE_ORDERS: StoreOrder[] = [
  {
    id: "so-1",
    orderId: "LD-ABC123",
    storeId: "store-1",
    customerName: "John D.",
    customerAddress: "123 Main St, Apt 4B, New York, NY 10001",
    deliveryMode: "express",
    items: [
      { productId: "1", productName: "Maker's Mark Bourbon", productImage: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400", quantity: 2, price: 29.99, total: 59.98 },
      { productId: "14", productName: "Fever-Tree Tonic Water", productImage: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", quantity: 1, price: 7.99, total: 7.99 },
    ],
    subtotal: 67.97,
    commission: 10.20,
    storePayout: 57.77,
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    estimatedPrepTime: 10,
    isGiftOrder: false,
  },
  {
    id: "so-2",
    orderId: "LD-DEF456",
    storeId: "store-1",
    customerName: "Sarah M.",
    customerAddress: "456 Park Ave, New York, NY 10022",
    deliveryMode: "express",
    items: [
      { productId: "5", productName: "Hendrick's Gin", productImage: "https://images.unsplash.com/photo-1608885898957-a559228e4b62?w=400", quantity: 1, price: 36.99, total: 36.99 },
    ],
    subtotal: 36.99,
    commission: 5.55,
    storePayout: 31.44,
    status: "preparing",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    estimatedPrepTime: 8,
    isGiftOrder: false,
  },
  {
    id: "so-3",
    orderId: "LD-GHI789",
    storeId: "store-1",
    customerName: "Mike R.",
    customerAddress: "789 Broadway, New York, NY 10003",
    deliveryMode: "shipping",
    items: [
      { productId: "2", productName: "The Macallan 18 Year", productImage: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400", quantity: 1, price: 349.99, total: 349.99 },
    ],
    subtotal: 349.99,
    commission: 52.50,
    storePayout: 297.49,
    status: "ready",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    preparedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    estimatedPrepTime: 15,
    isGiftOrder: true,
  },
  {
    id: "so-4",
    orderId: "LD-JKL012",
    storeId: "store-1",
    customerName: "Emily W.",
    customerAddress: "101 5th Ave, New York, NY 10003",
    deliveryMode: "express",
    items: [
      { productId: "16", productName: "Veuve Clicquot Yellow Label", productImage: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400", quantity: 2, price: 59.99, total: 119.98 },
      { productId: "3", productName: "Grey Goose Vodka", productImage: "https://images.unsplash.com/photo-1613063050781-8e3bcbf0e1c3?w=400", quantity: 1, price: 34.99, total: 34.99 },
    ],
    subtotal: 154.97,
    commission: 23.25,
    storePayout: 131.72,
    status: "completed",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
    preparedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 22.5 * 60 * 60 * 1000).toISOString(),
    estimatedPrepTime: 12,
    isGiftOrder: false,
  },
];

// ─── Default Application ────────────────────────────────────────────────

export function createEmptyApplication(): StoreApplication {
  return {
    id: `app-${Date.now().toString(36)}`,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: "",
    businessType: "independent",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ein: "",
    storeAddress: "",
    storeCity: "",
    storeState: "",
    storeZip: "",
    storePhone: "",
    storeWebsite: "",
    licenseType: "retail",
    licenseNumber: "",
    licenseState: "",
    licenseExpiry: "",
    operatingHours: createDefaultHours(),
    supportsExpress: true,
    supportsShipping: false,
    expressDeliveryRadius: 5,
    averageInventorySize: "",
    bankName: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
  };
}

export function createDefaultHours(): OperatingHours {
  const defaultDay: DayHours = { open: "10:00", close: "22:00", closed: false };
  return {
    monday: { ...defaultDay },
    tuesday: { ...defaultDay },
    wednesday: { ...defaultDay },
    thursday: { ...defaultDay },
    friday: { open: "10:00", close: "23:00", closed: false },
    saturday: { open: "10:00", close: "23:00", closed: false },
    sunday: { open: "12:00", close: "20:00", closed: false },
  };
}

// ─── Helper Functions ───────────────────────────────────────────────────

export function getStoreById(id: string): StoreProfile | undefined {
  return SAMPLE_STORES.find((s) => s.id === id);
}

export function getStoreOrders(storeId: string): StoreOrder[] {
  return SAMPLE_STORE_ORDERS.filter((o) => o.storeId === storeId);
}

export function getPendingOrders(storeId: string): StoreOrder[] {
  return SAMPLE_STORE_ORDERS.filter((o) => o.storeId === storeId && o.status === "pending");
}

export function getActiveStoreOrders(storeId: string): StoreOrder[] {
  return SAMPLE_STORE_ORDERS.filter(
    (o) => o.storeId === storeId && ["pending", "accepted", "preparing", "ready"].includes(o.status)
  );
}

export function getCompletedStoreOrders(storeId: string): StoreOrder[] {
  return SAMPLE_STORE_ORDERS.filter(
    (o) => o.storeId === storeId && ["completed", "shipped", "picked-up"].includes(o.status)
  );
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getApplicationStepCount(): number {
  return 5;
}

export function getApplicationStepTitle(step: number): string {
  switch (step) {
    case 0: return "Business Information";
    case 1: return "Store Details";
    case 2: return "Licensing";
    case 3: return "Operations";
    case 4: return "Payment Setup";
    default: return "";
  }
}
