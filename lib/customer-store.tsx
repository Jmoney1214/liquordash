import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ─────────────────────────────────────────────────────────────

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  avatarInitials: string;
  memberSince: string;
  isAgeVerified: boolean;
}

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Work", "Other"
  fullName: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
  instructions: string;
}

export type CardBrand = "visa" | "mastercard" | "amex" | "discover";

export interface PaymentMethod {
  id: string;
  type: "card" | "apple-pay" | "google-pay";
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  isDefault: boolean;
}

export type RewardsTier = "bronze" | "silver" | "gold" | "platinum";

export interface RewardsAccount {
  points: number;
  tier: RewardsTier;
  lifetimePoints: number;
  lifetimeOrders: number;
  lifetimeSpent: number;
  nextTierPoints: number;
  tierProgress: number; // 0-1
  history: RewardsTransaction[];
}

export interface RewardsTransaction {
  id: string;
  type: "earned" | "redeemed" | "bonus" | "expired";
  points: number;
  description: string;
  date: string;
  orderId?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newArrivals: boolean;
  priceDrops: boolean;
  rewardsAlerts: boolean;
  deliveryAlerts: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: "order" | "delivery" | "payment" | "account" | "other";
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  sender: "customer" | "support";
  text: string;
  timestamp: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// ─── Constants ─────────────────────────────────────────────────────────

export const TIER_THRESHOLDS: Record<RewardsTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 5000,
};

export const TIER_BENEFITS: Record<RewardsTier, string[]> = {
  bronze: ["Earn 1 point per $1 spent", "Birthday bonus 50 points", "Access to member deals"],
  silver: ["Earn 1.5x points per $1", "Birthday bonus 100 points", "Free delivery on orders $35+", "Early access to sales"],
  gold: ["Earn 2x points per $1", "Birthday bonus 200 points", "Free delivery on all orders", "Priority support", "Exclusive tastings"],
  platinum: ["Earn 3x points per $1", "Birthday bonus 500 points", "Free express delivery", "VIP support", "Rare bottle access", "Complimentary gift wrapping"],
};

export const TIER_COLORS: Record<RewardsTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

export const FAQ_DATA: FAQ[] = [
  { id: "1", question: "What is the minimum age to order?", answer: "You must be at least 21 years old to place an order on LiquorDash. We verify age at checkout and upon delivery.", category: "General" },
  { id: "2", question: "How does Express delivery work?", answer: "Express delivery is fulfilled by a local partner store near you. Orders are typically delivered within 30-60 minutes. Available in select areas.", category: "Delivery" },
  { id: "3", question: "How does shipping work?", answer: "Shipped orders are sent via UPS/FedEx from our warehouse or partner stores. Standard shipping takes 3-5 business days. An adult signature is required.", category: "Delivery" },
  { id: "4", question: "Can I return an order?", answer: "Due to alcohol regulations, we cannot accept returns on opened products. Unopened items can be returned within 14 days for a full refund.", category: "Returns" },
  { id: "5", question: "How do rewards points work?", answer: "Earn points on every purchase based on your tier. Points can be redeemed for discounts: 100 points = $5 off. Points expire after 12 months of inactivity.", category: "Rewards" },
  { id: "6", question: "Can I send alcohol as a gift?", answer: "Yes! During checkout, select the gift option to add a personal message and specify the recipient's address. The recipient must be 21+ and show valid ID.", category: "Gifting" },
  { id: "7", question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, American Express, Discover, Apple Pay, and Google Pay. All transactions are securely processed.", category: "Payment" },
  { id: "8", question: "How do I become a partner store?", answer: "Go to Profile > Become a Partner Store and complete the 5-step onboarding process. We'll review your application within 2-3 business days.", category: "Partner" },
  { id: "9", question: "Is my payment information secure?", answer: "Absolutely. We use industry-standard encryption and never store your full card details. All payments are processed through PCI-compliant payment processors.", category: "Payment" },
  { id: "10", question: "How do I track my order?", answer: "Go to the Orders tab to see real-time status updates. For shipped orders, you'll also receive a tracking number via email.", category: "Delivery" },
];

// ─── Default Data ──────────────────────────────────────────────────────

const DEFAULT_PROFILE: CustomerProfile = {
  id: "cust-001",
  firstName: "Guest",
  lastName: "User",
  email: "",
  phone: "",
  dateOfBirth: "",
  avatarInitials: "G",
  memberSince: new Date().toISOString(),
  isAgeVerified: true,
};

const DEFAULT_REWARDS: RewardsAccount = {
  points: 250,
  tier: "bronze",
  lifetimePoints: 250,
  lifetimeOrders: 0,
  lifetimeSpent: 0,
  nextTierPoints: 500,
  tierProgress: 0.5,
  history: [
    {
      id: "rw-1",
      type: "bonus",
      points: 200,
      description: "Welcome bonus",
      date: new Date().toISOString(),
    },
    {
      id: "rw-2",
      type: "bonus",
      points: 50,
      description: "Age verification bonus",
      date: new Date().toISOString(),
    },
  ],
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  orderUpdates: true,
  promotions: true,
  newArrivals: false,
  priceDrops: true,
  rewardsAlerts: true,
  deliveryAlerts: true,
};

// ─── State & Reducer ───────────────────────────────────────────────────

interface CustomerState {
  profile: CustomerProfile;
  addresses: SavedAddress[];
  paymentMethods: PaymentMethod[];
  rewards: RewardsAccount;
  notifications: NotificationPreferences;
  supportTickets: SupportTicket[];
}

type CustomerAction =
  | { type: "SET_PROFILE"; profile: CustomerProfile }
  | { type: "UPDATE_PROFILE"; updates: Partial<CustomerProfile> }
  | { type: "ADD_ADDRESS"; address: SavedAddress }
  | { type: "UPDATE_ADDRESS"; id: string; updates: Partial<SavedAddress> }
  | { type: "DELETE_ADDRESS"; id: string }
  | { type: "SET_DEFAULT_ADDRESS"; id: string }
  | { type: "ADD_PAYMENT"; payment: PaymentMethod }
  | { type: "DELETE_PAYMENT"; id: string }
  | { type: "SET_DEFAULT_PAYMENT"; id: string }
  | { type: "SET_REWARDS"; rewards: RewardsAccount }
  | { type: "ADD_POINTS"; points: number; description: string; orderId?: string }
  | { type: "REDEEM_POINTS"; points: number; description: string }
  | { type: "SET_NOTIFICATIONS"; prefs: Partial<NotificationPreferences> }
  | { type: "ADD_TICKET"; ticket: SupportTicket }
  | { type: "ADD_TICKET_MESSAGE"; ticketId: string; message: SupportMessage }
  | { type: "LOAD_STATE"; state: Partial<CustomerState> };

function getTierForPoints(points: number): RewardsTier {
  if (points >= TIER_THRESHOLDS.platinum) return "platinum";
  if (points >= TIER_THRESHOLDS.gold) return "gold";
  if (points >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

function getNextTierPoints(tier: RewardsTier): number {
  switch (tier) {
    case "bronze": return TIER_THRESHOLDS.silver;
    case "silver": return TIER_THRESHOLDS.gold;
    case "gold": return TIER_THRESHOLDS.platinum;
    case "platinum": return TIER_THRESHOLDS.platinum;
  }
}

function customerReducer(state: CustomerState, action: CustomerAction): CustomerState {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profile: action.profile };
    case "UPDATE_PROFILE": {
      const updated = { ...state.profile, ...action.updates };
      if (action.updates.firstName || action.updates.lastName) {
        updated.avatarInitials = (updated.firstName[0] || "") + (updated.lastName[0] || "");
      }
      return { ...state, profile: updated };
    }
    case "ADD_ADDRESS":
      return {
        ...state,
        addresses: action.address.isDefault
          ? [...state.addresses.map((a) => ({ ...a, isDefault: false })), action.address]
          : [...state.addresses, action.address],
      };
    case "UPDATE_ADDRESS":
      return {
        ...state,
        addresses: state.addresses.map((a) =>
          a.id === action.id ? { ...a, ...action.updates } : a
        ),
      };
    case "DELETE_ADDRESS":
      return { ...state, addresses: state.addresses.filter((a) => a.id !== action.id) };
    case "SET_DEFAULT_ADDRESS":
      return {
        ...state,
        addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === action.id })),
      };
    case "ADD_PAYMENT":
      return {
        ...state,
        paymentMethods: action.payment.isDefault
          ? [...state.paymentMethods.map((p) => ({ ...p, isDefault: false })), action.payment]
          : [...state.paymentMethods, action.payment],
      };
    case "DELETE_PAYMENT":
      return { ...state, paymentMethods: state.paymentMethods.filter((p) => p.id !== action.id) };
    case "SET_DEFAULT_PAYMENT":
      return {
        ...state,
        paymentMethods: state.paymentMethods.map((p) => ({ ...p, isDefault: p.id === action.id })),
      };
    case "SET_REWARDS":
      return { ...state, rewards: action.rewards };
    case "ADD_POINTS": {
      const newLifetime = state.rewards.lifetimePoints + action.points;
      const newTier = getTierForPoints(newLifetime);
      const nextTier = getNextTierPoints(newTier);
      const currentThreshold = TIER_THRESHOLDS[newTier];
      const progress = newTier === "platinum" ? 1 : (newLifetime - currentThreshold) / (nextTier - currentThreshold);
      return {
        ...state,
        rewards: {
          ...state.rewards,
          points: state.rewards.points + action.points,
          lifetimePoints: newLifetime,
          tier: newTier,
          nextTierPoints: nextTier,
          tierProgress: Math.min(progress, 1),
          history: [
            {
              id: `rw-${Date.now().toString(36)}`,
              type: "earned",
              points: action.points,
              description: action.description,
              date: new Date().toISOString(),
              orderId: action.orderId,
            },
            ...state.rewards.history,
          ],
        },
      };
    }
    case "REDEEM_POINTS":
      return {
        ...state,
        rewards: {
          ...state.rewards,
          points: Math.max(0, state.rewards.points - action.points),
          history: [
            {
              id: `rw-${Date.now().toString(36)}`,
              type: "redeemed",
              points: -action.points,
              description: action.description,
              date: new Date().toISOString(),
            },
            ...state.rewards.history,
          ],
        },
      };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: { ...state.notifications, ...action.prefs } };
    case "ADD_TICKET":
      return { ...state, supportTickets: [action.ticket, ...state.supportTickets] };
    case "ADD_TICKET_MESSAGE":
      return {
        ...state,
        supportTickets: state.supportTickets.map((t) =>
          t.id === action.ticketId
            ? { ...t, messages: [...t.messages, action.message], updatedAt: new Date().toISOString() }
            : t
        ),
      };
    case "LOAD_STATE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────

interface CustomerContextValue {
  profile: CustomerProfile;
  updateProfile: (updates: Partial<CustomerProfile>) => void;
  // Addresses
  addresses: SavedAddress[];
  defaultAddress: SavedAddress | undefined;
  addAddress: (address: Omit<SavedAddress, "id">) => void;
  updateAddress: (id: string, updates: Partial<SavedAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  // Payments
  paymentMethods: PaymentMethod[];
  defaultPayment: PaymentMethod | undefined;
  addPayment: (payment: Omit<PaymentMethod, "id">) => void;
  deletePayment: (id: string) => void;
  setDefaultPayment: (id: string) => void;
  // Rewards
  rewards: RewardsAccount;
  addPoints: (points: number, description: string, orderId?: string) => void;
  redeemPoints: (points: number, description: string) => void;
  // Notifications
  notifications: NotificationPreferences;
  updateNotifications: (prefs: Partial<NotificationPreferences>) => void;
  // Support
  supportTickets: SupportTicket[];
  createTicket: (subject: string, category: SupportTicket["category"], message: string) => void;
  addTicketMessage: (ticketId: string, text: string) => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

const CUSTOMER_KEY = "liquordash_customer";

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(customerReducer, {
    profile: DEFAULT_PROFILE,
    addresses: [],
    paymentMethods: [],
    rewards: DEFAULT_REWARDS,
    notifications: DEFAULT_NOTIFICATIONS,
    supportTickets: [],
  });

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CUSTOMER_KEY);
        if (stored) {
          dispatch({ type: "LOAD_STATE", state: JSON.parse(stored) });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Persist
  useEffect(() => {
    AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const updateProfile = useCallback((updates: Partial<CustomerProfile>) => {
    dispatch({ type: "UPDATE_PROFILE", updates });
  }, []);

  const addAddress = useCallback((address: Omit<SavedAddress, "id">) => {
    dispatch({ type: "ADD_ADDRESS", address: { ...address, id: `addr-${Date.now().toString(36)}` } });
  }, []);

  const updateAddress = useCallback((id: string, updates: Partial<SavedAddress>) => {
    dispatch({ type: "UPDATE_ADDRESS", id, updates });
  }, []);

  const deleteAddress = useCallback((id: string) => {
    dispatch({ type: "DELETE_ADDRESS", id });
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    dispatch({ type: "SET_DEFAULT_ADDRESS", id });
  }, []);

  const addPayment = useCallback((payment: Omit<PaymentMethod, "id">) => {
    dispatch({ type: "ADD_PAYMENT", payment: { ...payment, id: `pay-${Date.now().toString(36)}` } });
  }, []);

  const deletePayment = useCallback((id: string) => {
    dispatch({ type: "DELETE_PAYMENT", id });
  }, []);

  const setDefaultPayment = useCallback((id: string) => {
    dispatch({ type: "SET_DEFAULT_PAYMENT", id });
  }, []);

  const addPoints = useCallback((points: number, description: string, orderId?: string) => {
    dispatch({ type: "ADD_POINTS", points, description, orderId });
  }, []);

  const redeemPoints = useCallback((points: number, description: string) => {
    dispatch({ type: "REDEEM_POINTS", points, description });
  }, []);

  const updateNotifications = useCallback((prefs: Partial<NotificationPreferences>) => {
    dispatch({ type: "SET_NOTIFICATIONS", prefs });
  }, []);

  const createTicket = useCallback((subject: string, category: SupportTicket["category"], message: string) => {
    const ticket: SupportTicket = {
      id: `tkt-${Date.now().toString(36)}`,
      subject,
      category,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now().toString(36)}`,
          sender: "customer",
          text: message,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    dispatch({ type: "ADD_TICKET", ticket });

    // Simulate auto-reply after 1 second
    setTimeout(() => {
      dispatch({
        type: "ADD_TICKET_MESSAGE",
        ticketId: ticket.id,
        message: {
          id: `msg-${(Date.now() + 1).toString(36)}`,
          sender: "support",
          text: "Thank you for reaching out! A member of our support team will review your request and get back to you within 24 hours. In the meantime, check our FAQ for quick answers.",
          timestamp: new Date().toISOString(),
        },
      });
    }, 1000);
  }, []);

  const addTicketMessage = useCallback((ticketId: string, text: string) => {
    dispatch({
      type: "ADD_TICKET_MESSAGE",
      ticketId,
      message: {
        id: `msg-${Date.now().toString(36)}`,
        sender: "customer",
        text,
        timestamp: new Date().toISOString(),
      },
    });
  }, []);

  const defaultAddress = useMemo(() => state.addresses.find((a) => a.isDefault) || state.addresses[0], [state.addresses]);
  const defaultPayment = useMemo(() => state.paymentMethods.find((p) => p.isDefault) || state.paymentMethods[0], [state.paymentMethods]);

  const value = useMemo<CustomerContextValue>(
    () => ({
      profile: state.profile,
      updateProfile,
      addresses: state.addresses,
      defaultAddress,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      paymentMethods: state.paymentMethods,
      defaultPayment,
      addPayment,
      deletePayment,
      setDefaultPayment,
      rewards: state.rewards,
      addPoints,
      redeemPoints,
      notifications: state.notifications,
      updateNotifications,
      supportTickets: state.supportTickets,
      createTicket,
      addTicketMessage,
    }),
    [state, defaultAddress, defaultPayment, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, addPayment, deletePayment, setDefaultPayment, addPoints, redeemPoints, updateNotifications, createTicket, addTicketMessage]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
