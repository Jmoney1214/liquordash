import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Order, CartItem, DeliveryMode, OrderStatus } from "./data";

const ORDERS_KEY = "liquordash_orders";

interface OrdersState {
  orders: Order[];
}

type OrdersAction =
  | { type: "SET_ORDERS"; orders: Order[] }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPDATE_STATUS"; orderId: string; status: OrderStatus }
  | { type: "UPDATE_UBER_DELIVERY"; orderId: string; uber: Partial<Pick<Order, "uberDeliveryId" | "uberTrackingUrl" | "uberQuoteId" | "uberFee" | "uberStatus" | "uberCourier" | "uberPickupEta" | "uberDropoffEta">> };

function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case "SET_ORDERS":
      return { orders: action.orders };
    case "ADD_ORDER":
      return { orders: [action.order, ...state.orders] };
    case "UPDATE_STATUS":
      return {
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: action.status } : o
        ),
      };
    case "UPDATE_UBER_DELIVERY":
      return {
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, ...action.uber } : o
        ),
      };
    default:
      return state;
  }
}

interface OrdersContextValue {
  orders: Order[];
  activeOrders: Order[];
  pastOrders: Order[];
  placeOrder: (params: {
    items: CartItem[];
    deliveryMode: DeliveryMode;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    tax: number;
    total: number;
    deliveryAddress: string;
    uberQuoteId?: string;
    uberFee?: number;
  }) => Order;
  updateUberDelivery: (orderId: string, uber: Partial<Pick<Order, "uberDeliveryId" | "uberTrackingUrl" | "uberQuoteId" | "uberFee" | "uberStatus" | "uberCourier" | "uberPickupEta" | "uberDropoffEta">>) => void;
  getOrder: (id: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ordersReducer, { orders: [] });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ORDERS_KEY);
        if (stored) {
          dispatch({ type: "SET_ORDERS", orders: JSON.parse(stored) });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(state.orders)).catch(() => {});
  }, [state.orders]);

  const placeOrder = useCallback(
    (params: {
      items: CartItem[];
      deliveryMode: DeliveryMode;
      subtotal: number;
      deliveryFee: number;
      serviceFee: number;
      tax: number;
      total: number;
      deliveryAddress: string;
      uberQuoteId?: string;
      uberFee?: number;
    }): Order => {
      const now = new Date();
      const estimatedDelivery =
        params.deliveryMode === "express"
          ? new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1 hour
          : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days

      const order: Order = {
        id: `LD-${Date.now().toString(36).toUpperCase()}`,
        items: params.items,
        status: "confirmed",
        deliveryMode: params.deliveryMode,
        total: params.total,
        subtotal: params.subtotal,
        deliveryFee: params.deliveryFee,
        serviceFee: params.serviceFee,
        tax: params.tax,
        createdAt: now.toISOString(),
        estimatedDelivery,
        trackingNumber: params.deliveryMode === "shipping" ? `TRK${Date.now().toString(36).toUpperCase()}` : undefined,
        deliveryAddress: params.deliveryAddress,
        uberQuoteId: params.uberQuoteId,
        uberFee: params.uberFee,
      };

      dispatch({ type: "ADD_ORDER", order });
      return order;
    },
    []
  );

  const updateUberDelivery = useCallback(
    (orderId: string, uber: Partial<Pick<Order, "uberDeliveryId" | "uberTrackingUrl" | "uberQuoteId" | "uberFee" | "uberStatus" | "uberCourier" | "uberPickupEta" | "uberDropoffEta">>) => {
      dispatch({ type: "UPDATE_UBER_DELIVERY", orderId, uber });
    },
    []
  );

  const getOrder = useCallback(
    (id: string) => state.orders.find((o) => o.id === id),
    [state.orders]
  );

  const activeOrders = useMemo(
    () => state.orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [state.orders]
  );

  const pastOrders = useMemo(
    () => state.orders.filter((o) => o.status === "delivered" || o.status === "cancelled"),
    [state.orders]
  );

  const value = useMemo<OrdersContextValue>(
    () => ({ orders: state.orders, activeOrders, pastOrders, placeOrder, updateUberDelivery, getOrder }),
    [state.orders, activeOrders, pastOrders, placeOrder, updateUberDelivery, getOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
