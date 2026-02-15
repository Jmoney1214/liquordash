import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartItem, Product, DeliveryMode } from "./data";

const CART_KEY = "liquordash_cart";
const DELIVERY_MODE_KEY = "liquordash_delivery_mode";

interface CartState {
  items: CartItem[];
  deliveryMode: DeliveryMode;
}

type CartAction =
  | { type: "SET_ITEMS"; items: CartItem[] }
  | { type: "ADD_ITEM"; product: Product; quantity: number; isGift?: boolean; giftMessage?: string; recipientName?: string; recipientAddress?: string }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "SET_DELIVERY_MODE"; mode: DeliveryMode };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.items };
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: action.quantity,
            isGift: action.isGift ?? false,
            giftMessage: action.giftMessage,
            recipientName: action.recipientName,
            recipientAddress: action.recipientAddress,
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "SET_DELIVERY_MODE":
      return { ...state, deliveryMode: action.mode };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  deliveryMode: DeliveryMode;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
  addItem: (product: Product, quantity?: number, giftOptions?: { isGift: boolean; giftMessage?: string; recipientName?: string; recipientAddress?: string }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryMode: (mode: DeliveryMode) => void;
  expressItems: CartItem[];
  shippingItems: CartItem[];
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], deliveryMode: "express" });

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_KEY);
        if (stored) {
          dispatch({ type: "SET_ITEMS", items: JSON.parse(stored) });
        }
        const mode = await AsyncStorage.getItem(DELIVERY_MODE_KEY);
        if (mode === "express" || mode === "shipping") {
          dispatch({ type: "SET_DELIVERY_MODE", mode });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Persist cart to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify(state.items)).catch(() => {});
  }, [state.items]);

  useEffect(() => {
    AsyncStorage.setItem(DELIVERY_MODE_KEY, state.deliveryMode).catch(() => {});
  }, [state.deliveryMode]);

  const addItem = useCallback(
    (product: Product, quantity = 1, giftOptions?: { isGift: boolean; giftMessage?: string; recipientName?: string; recipientAddress?: string }) => {
      dispatch({
        type: "ADD_ITEM",
        product,
        quantity,
        isGift: giftOptions?.isGift,
        giftMessage: giftOptions?.giftMessage,
        recipientName: giftOptions?.recipientName,
        recipientAddress: giftOptions?.recipientAddress,
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const setDeliveryMode = useCallback((mode: DeliveryMode) => {
    dispatch({ type: "SET_DELIVERY_MODE", mode });
  }, []);

  const expressItems = useMemo(
    () => state.items.filter((i) => i.product.expressAvailable),
    [state.items]
  );

  const shippingItems = useMemo(
    () => state.items.filter((i) => i.product.shippingAvailable),
    [state.items]
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [state.items]
  );

  const deliveryFee = useMemo(() => {
    if (state.items.length === 0) return 0;
    if (subtotal >= 50) return 0; // Free delivery over $50
    return state.deliveryMode === "express" ? 5.99 : 9.99;
  }, [state.items.length, subtotal, state.deliveryMode]);

  const serviceFee = useMemo(() => {
    if (state.items.length === 0) return 0;
    return Math.round(subtotal * 0.05 * 100) / 100; // 5% service fee
  }, [state.items.length, subtotal]);

  const tax = useMemo(() => {
    return Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
  }, [subtotal]);

  const total = useMemo(
    () => Math.round((subtotal + deliveryFee + serviceFee + tax) * 100) / 100,
    [subtotal, deliveryFee, serviceFee, tax]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      deliveryMode: state.deliveryMode,
      itemCount,
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setDeliveryMode,
      expressItems,
      shippingItems,
    }),
    [state.items, state.deliveryMode, itemCount, subtotal, deliveryFee, serviceFee, tax, total, addItem, removeItem, updateQuantity, clearCart, setDeliveryMode, expressItems, shippingItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
