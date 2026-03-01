/**
 * useWebSocket — client-side WebSocket hook with auto-reconnect, room management,
 * and typed event subscriptions.
 *
 * Usage:
 *   const { connectionState, subscribe, joinRoom, leaveRoom } = useWebSocket();
 *
 *   useEffect(() => {
 *     joinRoom("order:abc123");
 *     const unsub = subscribe("order_status_updated", (payload) => { ... });
 *     return () => { unsub(); leaveRoom("order:abc123"); };
 *   }, []);
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { Platform, AppState, type AppStateStatus } from "react-native";
import {
  WS_EVENTS,
  createWsMessage,
  parseWsMessage,
  type WsEventName,
  type WsMessage,
  type ConnectionState,
} from "@/shared/ws-events";

// ─── Config ───

const WS_RECONNECT_BASE_MS = 1000;
const WS_RECONNECT_MAX_MS = 30000;
const WS_PING_INTERVAL_MS = 25000;
const WS_MAX_RECONNECT_ATTEMPTS = 20;

function getWsUrl(): string {
  if (Platform.OS === "web") {
    // In web, derive from current page URL
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    // API server is on port 3000
    return `${proto}//${window.location.hostname}:3000/ws`;
  }
  // For native, use the API server URL
  // In dev, this would be localhost or the tunnel URL
  return "ws://localhost:3000/ws";
}

// ─── Types ───

type EventHandler = (payload: unknown, room?: string) => void;
type Unsubscribe = () => void;

// ─── Singleton connection manager ───

class WebSocketManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private eventListeners = new Map<string, Set<EventHandler>>();
  private rooms = new Set<string>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private refCount = 0;

  connect(): void {
    this.refCount++;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.doConnect();
  }

  disconnect(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      this.doDisconnect();
    }
  }

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(listener: (state: ConnectionState) => void): Unsubscribe {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  subscribe(event: WsEventName | string, handler: EventHandler): Unsubscribe {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => {
      this.eventListeners.get(event)?.delete(handler);
    };
  }

  joinRoom(room: string): void {
    this.rooms.add(room);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send(WS_EVENTS.JOIN_ROOM, { room });
    }
  }

  leaveRoom(room: string): void {
    this.rooms.delete(room);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send(WS_EVENTS.LEAVE_ROOM, { room });
    }
  }

  getRooms(): string[] {
    return Array.from(this.rooms);
  }

  // ─── Internal ───

  private doConnect(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      try { this.ws.close(); } catch {}
    }

    this.setState("connecting");

    try {
      const url = getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState("connected");

        // Rejoin all rooms
        for (const room of this.rooms) {
          this.send(WS_EVENTS.JOIN_ROOM, { room });
        }

        // Start ping interval
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        const msg = parseWsMessage(typeof event.data === "string" ? event.data : "");
        if (!msg) return;

        // Dispatch to listeners
        const handlers = this.eventListeners.get(msg.event);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(msg.payload, msg.room);
            } catch (err) {
              console.error("[ws] Event handler error:", err);
            }
          }
        }

        // Also dispatch to wildcard listeners
        const wildcardHandlers = this.eventListeners.get("*");
        if (wildcardHandlers) {
          for (const handler of wildcardHandlers) {
            try {
              handler(msg, msg.room);
            } catch (err) {
              console.error("[ws] Wildcard handler error:", err);
            }
          }
        }
      };

      this.ws.onclose = () => {
        this.stopPing();
        if (this.refCount > 0) {
          this.scheduleReconnect();
        } else {
          this.setState("disconnected");
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch (err) {
      console.error("[ws] Connection error:", err);
      this.scheduleReconnect();
    }
  }

  private doDisconnect(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.setState("disconnected");
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      this.setState("disconnected");
      return;
    }

    this.setState("reconnecting");
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts),
      WS_RECONNECT_MAX_MS,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send(WS_EVENTS.PING, {});
      }
    }, WS_PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private send(event: string, payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = createWsMessage(event as WsEventName, payload);
      this.ws.send(JSON.stringify(msg));
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

// ─── React Hook ───

export function useWebSocket() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(wsManager.getState());

  useEffect(() => {
    // Connect on mount
    wsManager.connect();

    // Listen to state changes
    const unsub = wsManager.onStateChange(setConnectionState);

    // Handle app state changes (background/foreground)
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        wsManager.connect();
      }
    };
    const subscription = AppState.addEventListener("change", handleAppState);

    return () => {
      unsub();
      subscription.remove();
      wsManager.disconnect();
    };
  }, []);

  const subscribe = useCallback(
    (event: WsEventName | string, handler: EventHandler): Unsubscribe => {
      return wsManager.subscribe(event, handler);
    },
    [],
  );

  const joinRoom = useCallback((room: string) => {
    wsManager.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    wsManager.leaveRoom(room);
  }, []);

  const getRooms = useCallback(() => {
    return wsManager.getRooms();
  }, []);

  return {
    connectionState,
    isConnected: connectionState === "connected",
    subscribe,
    joinRoom,
    leaveRoom,
    getRooms,
  };
}

// ─── Specialized hooks ───

/**
 * Subscribe to real-time updates for a specific order.
 */
export function useOrderTracking(orderId: string | null) {
  const { joinRoom, leaveRoom, subscribe, isConnected } = useWebSocket();
  const [status, setStatus] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
  } | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    phone: string;
    vehicle: string;
  } | null>(null);
  const [events, setEvents] = useState<Array<{ event: string; payload: unknown; time: string }>>([]);

  useEffect(() => {
    if (!orderId) return;

    const room = `order:${orderId}`;
    joinRoom(room);

    const unsubs = [
      subscribe(WS_EVENTS.ORDER_STATUS_UPDATED, (payload: any) => {
        if (payload.orderId === orderId) {
          setStatus(payload.newStatus);
          setEvents((prev) => [...prev, { event: "status", payload, time: new Date().toISOString() }]);
        }
      }),
      subscribe(WS_EVENTS.DRIVER_LOCATION_UPDATED, (payload: any) => {
        if (payload.orderId === orderId) {
          setDriverLocation({
            latitude: payload.latitude,
            longitude: payload.longitude,
            heading: payload.heading,
          });
        }
      }),
      subscribe(WS_EVENTS.DRIVER_ETA_UPDATED, (payload: any) => {
        if (payload.orderId === orderId) {
          setEta(payload.etaMinutes);
        }
      }),
      subscribe(WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER, (payload: any) => {
        if (payload.orderId === orderId) {
          setDriverInfo({
            name: payload.driverName,
            phone: payload.driverPhone,
            vehicle: payload.vehicleDescription,
          });
          setEvents((prev) => [...prev, { event: "driver_assigned", payload, time: new Date().toISOString() }]);
        }
      }),
      subscribe(WS_EVENTS.ORDER_PICKED_UP, (payload: any) => {
        if (payload.orderId === orderId) {
          setEvents((prev) => [...prev, { event: "picked_up", payload, time: new Date().toISOString() }]);
        }
      }),
      subscribe(WS_EVENTS.ORDER_DELIVERED, (payload: any) => {
        if (payload.orderId === orderId) {
          setEvents((prev) => [...prev, { event: "delivered", payload, time: new Date().toISOString() }]);
        }
      }),
    ];

    return () => {
      leaveRoom(room);
      unsubs.forEach((u) => u());
    };
  }, [orderId]);

  return { status, driverLocation, eta, driverInfo, events, isConnected };
}

/**
 * Subscribe to real-time store order notifications.
 */
export function useStoreNotifications(storeId: string | null) {
  const { joinRoom, leaveRoom, subscribe, isConnected } = useWebSocket();
  const [newOrders, setNewOrders] = useState<unknown[]>([]);
  const [driverArrivals, setDriverArrivals] = useState<unknown[]>([]);
  const [orderUpdates, setOrderUpdates] = useState<unknown[]>([]);

  useEffect(() => {
    if (!storeId) return;

    const room = `store:${storeId}`;
    joinRoom(room);

    const unsubs = [
      subscribe(WS_EVENTS.STORE_NEW_ORDER, (payload) => {
        setNewOrders((prev) => [payload, ...prev].slice(0, 50));
      }),
      subscribe(WS_EVENTS.STORE_DRIVER_ARRIVING, (payload) => {
        setDriverArrivals((prev) => [payload, ...prev].slice(0, 20));
      }),
      subscribe(WS_EVENTS.ORDER_STATUS_UPDATED, (payload) => {
        setOrderUpdates((prev) => [payload, ...prev].slice(0, 50));
      }),
    ];

    return () => {
      leaveRoom(room);
      unsubs.forEach((u) => u());
    };
  }, [storeId]);

  const clearNewOrders = useCallback(() => setNewOrders([]), []);

  return { newOrders, driverArrivals, orderUpdates, clearNewOrders, isConnected };
}

/**
 * Subscribe to real-time driver job updates.
 */
export function useDriverNotifications(driverId: string | null) {
  const { joinRoom, leaveRoom, subscribe, isConnected } = useWebSocket();
  const [jobUpdates, setJobUpdates] = useState<unknown[]>([]);

  useEffect(() => {
    if (!driverId) return;

    const room = `driver:${driverId}`;
    joinRoom(room);

    const unsubs = [
      subscribe(WS_EVENTS.DRIVER_LOCATION_UPDATED, (payload) => {
        setJobUpdates((prev) => [payload, ...prev].slice(0, 20));
      }),
    ];

    return () => {
      leaveRoom(room);
      unsubs.forEach((u) => u());
    };
  }, [driverId]);

  return { jobUpdates, isConnected };
}

/**
 * Subscribe to real-time admin platform notifications.
 */
export function useAdminNotifications() {
  const { joinRoom, leaveRoom, subscribe, isConnected } = useWebSocket();
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const [newOrders, setNewOrders] = useState<unknown[]>([]);
  const [newApplications, setNewApplications] = useState<unknown[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const room = "admin:platform";
    joinRoom(room);

    const unsubs = [
      subscribe(WS_EVENTS.ADMIN_ALERT, (payload) => {
        setAlerts((prev) => [payload, ...prev].slice(0, 100));
        setUnreadCount((c) => c + 1);
      }),
      subscribe(WS_EVENTS.ADMIN_NEW_ORDER, (payload) => {
        setNewOrders((prev) => [payload, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
      }),
      subscribe(WS_EVENTS.ADMIN_NEW_STORE_APPLICATION, (payload) => {
        setNewApplications((prev) => [payload, ...prev].slice(0, 20));
        setUnreadCount((c) => c + 1);
      }),
      subscribe(WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION, (payload) => {
        setNewApplications((prev) => [payload, ...prev].slice(0, 20));
        setUnreadCount((c) => c + 1);
      }),
    ];

    return () => {
      leaveRoom(room);
      unsubs.forEach((u) => u());
    };
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return { alerts, newOrders, newApplications, unreadCount, markAllRead, isConnected };
}
