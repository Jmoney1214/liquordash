import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StoreApplication,
  StoreProfile,
  StoreOrder,
  StoreOrderStatus,
  StoreDashboardMetrics,
  SAMPLE_STORES,
  SAMPLE_STORE_ORDERS,
  createEmptyApplication,
} from "./store-data";

const STORE_KEY = "liquordash_store";
const APP_KEY = "liquordash_store_application";

type AppMode = "customer" | "store";

interface StoreState {
  mode: AppMode;
  application: StoreApplication | null;
  storeProfile: StoreProfile | null;
  storeOrders: StoreOrder[];
  isOnboarded: boolean;
}

type StoreAction =
  | { type: "SET_MODE"; mode: AppMode }
  | { type: "SET_APPLICATION"; application: StoreApplication }
  | { type: "SET_STORE_PROFILE"; profile: StoreProfile }
  | { type: "SET_STORE_ORDERS"; orders: StoreOrder[] }
  | { type: "UPDATE_ORDER_STATUS"; orderId: string; status: StoreOrderStatus }
  | { type: "SET_ONBOARDED"; value: boolean }
  | { type: "LOAD_STATE"; state: Partial<StoreState> };

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_APPLICATION":
      return { ...state, application: action.application };
    case "SET_STORE_PROFILE":
      return { ...state, storeProfile: action.profile, isOnboarded: true };
    case "SET_STORE_ORDERS":
      return { ...state, storeOrders: action.orders };
    case "UPDATE_ORDER_STATUS":
      return {
        ...state,
        storeOrders: state.storeOrders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                status: action.status,
                ...(action.status === "accepted" ? { acceptedAt: new Date().toISOString() } : {}),
                ...(action.status === "ready" || action.status === "shipped"
                  ? { preparedAt: new Date().toISOString() }
                  : {}),
                ...(action.status === "completed" ? { completedAt: new Date().toISOString() } : {}),
              }
            : o
        ),
      };
    case "SET_ONBOARDED":
      return { ...state, isOnboarded: action.value };
    case "LOAD_STATE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

interface StoreContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isOnboarded: boolean;
  application: StoreApplication | null;
  storeProfile: StoreProfile | null;
  storeOrders: StoreOrder[];
  pendingOrders: StoreOrder[];
  activeOrders: StoreOrder[];
  completedOrders: StoreOrder[];
  metrics: StoreDashboardMetrics;
  startApplication: () => StoreApplication;
  updateApplication: (updates: Partial<StoreApplication>) => void;
  submitApplication: () => void;
  // Demo: approve application instantly
  approveApplication: () => void;
  updateOrderStatus: (orderId: string, status: StoreOrderStatus) => void;
  getStoreOrder: (orderId: string) => StoreOrder | undefined;
  // Available stores for customer
  availableStores: StoreProfile[];
  selectedStore: StoreProfile | null;
  selectStore: (storeId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, {
    mode: "customer",
    application: null,
    storeProfile: null,
    storeOrders: [],
    isOnboarded: false,
  });

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch({ type: "LOAD_STATE", state: parsed });
        }
        const appStored = await AsyncStorage.getItem(APP_KEY);
        if (appStored) {
          dispatch({ type: "SET_APPLICATION", application: JSON.parse(appStored) });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Persist state
  useEffect(() => {
    const toSave = {
      mode: state.mode,
      isOnboarded: state.isOnboarded,
      storeProfile: state.storeProfile,
      storeOrders: state.storeOrders,
    };
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state.mode, state.isOnboarded, state.storeProfile, state.storeOrders]);

  useEffect(() => {
    if (state.application) {
      AsyncStorage.setItem(APP_KEY, JSON.stringify(state.application)).catch(() => {});
    }
  }, [state.application]);

  const setMode = useCallback((mode: AppMode) => {
    dispatch({ type: "SET_MODE", mode });
  }, []);

  const startApplication = useCallback(() => {
    const app = createEmptyApplication();
    dispatch({ type: "SET_APPLICATION", application: app });
    return app;
  }, []);

  const updateApplication = useCallback((updates: Partial<StoreApplication>) => {
    if (!state.application) return;
    const updated = { ...state.application, ...updates, updatedAt: new Date().toISOString() };
    dispatch({ type: "SET_APPLICATION", application: updated });
  }, [state.application]);

  const submitApplication = useCallback(() => {
    if (!state.application) return;
    const updated = { ...state.application, status: "submitted" as const, updatedAt: new Date().toISOString() };
    dispatch({ type: "SET_APPLICATION", application: updated });
  }, [state.application]);

  const approveApplication = useCallback(() => {
    if (!state.application) return;
    const updated = { ...state.application, status: "approved" as const, updatedAt: new Date().toISOString() };
    dispatch({ type: "SET_APPLICATION", application: updated });

    // Create store profile from application
    const profile: StoreProfile = {
      id: `store-${Date.now().toString(36)}`,
      applicationId: updated.id,
      name: updated.businessName || "My Store",
      description: `${updated.businessType} liquor store`,
      address: updated.storeAddress,
      city: updated.storeCity,
      state: updated.storeState,
      zip: updated.storeZip,
      phone: updated.storePhone,
      email: updated.ownerEmail,
      website: updated.storeWebsite,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400",
      rating: 0,
      reviewCount: 0,
      operatingHours: updated.operatingHours,
      supportsExpress: updated.supportsExpress,
      supportsShipping: updated.supportsShipping,
      expressDeliveryRadius: updated.expressDeliveryRadius,
      isActive: true,
      joinedAt: new Date().toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      averageRating: 0,
      acceptanceRate: 100,
      averagePrepTime: 0,
    };

    dispatch({ type: "SET_STORE_PROFILE", profile });
    // Load sample orders for demo
    dispatch({ type: "SET_STORE_ORDERS", orders: [...SAMPLE_STORE_ORDERS] });
  }, [state.application]);

  const updateOrderStatus = useCallback((orderId: string, status: StoreOrderStatus) => {
    dispatch({ type: "UPDATE_ORDER_STATUS", orderId, status });
  }, []);

  const getStoreOrder = useCallback(
    (orderId: string) => state.storeOrders.find((o) => o.id === orderId),
    [state.storeOrders]
  );

  const pendingOrders = useMemo(
    () => state.storeOrders.filter((o) => o.status === "pending"),
    [state.storeOrders]
  );

  const activeOrders = useMemo(
    () => state.storeOrders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)),
    [state.storeOrders]
  );

  const completedOrders = useMemo(
    () => state.storeOrders.filter((o) => ["completed", "shipped", "picked-up"].includes(o.status)),
    [state.storeOrders]
  );

  const metrics = useMemo<StoreDashboardMetrics>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

    const todayOrders = state.storeOrders.filter((o) => new Date(o.createdAt).getTime() >= todayStart);
    const weekOrders = state.storeOrders.filter((o) => new Date(o.createdAt).getTime() >= weekStart);
    const monthOrders = state.storeOrders.filter((o) => new Date(o.createdAt).getTime() >= monthStart);

    return {
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + o.storePayout, 0),
      pendingOrders: pendingOrders.length,
      preparingOrders: activeOrders.length,
      weeklyOrders: weekOrders.length,
      weeklyRevenue: weekOrders.reduce((s, o) => s + o.storePayout, 0),
      monthlyOrders: monthOrders.length,
      monthlyRevenue: monthOrders.reduce((s, o) => s + o.storePayout, 0),
      averageRating: state.storeProfile?.averageRating ?? 0,
      acceptanceRate: state.storeProfile?.acceptanceRate ?? 100,
    };
  }, [state.storeOrders, state.storeProfile, pendingOrders, activeOrders]);

  // Customer-facing store selection
  const [selectedStoreId, setSelectedStoreId] = React.useState<string>("store-1");

  const availableStores = useMemo(() => SAMPLE_STORES.filter((s) => s.isActive), []);

  const selectedStore = useMemo(
    () => SAMPLE_STORES.find((s) => s.id === selectedStoreId) ?? null,
    [selectedStoreId]
  );

  const selectStore = useCallback((storeId: string) => {
    setSelectedStoreId(storeId);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      mode: state.mode,
      setMode,
      isOnboarded: state.isOnboarded,
      application: state.application,
      storeProfile: state.storeProfile,
      storeOrders: state.storeOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      metrics,
      startApplication,
      updateApplication,
      submitApplication,
      approveApplication,
      updateOrderStatus,
      getStoreOrder,
      availableStores,
      selectedStore,
      selectStore,
    }),
    [
      state.mode, state.isOnboarded, state.application, state.storeProfile, state.storeOrders,
      pendingOrders, activeOrders, completedOrders, metrics,
      setMode, startApplication, updateApplication, submitApplication, approveApplication,
      updateOrderStatus, getStoreOrder, availableStores, selectedStore, selectStore,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
