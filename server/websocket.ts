/**
 * WebSocket Server — room-based pub/sub for real-time order updates.
 *
 * Rooms:
 *   order:<orderId>  — customers tracking a specific order
 *   store:<storeId>  — store partners receiving new orders
 *   driver:<driverId> — drivers receiving job updates
 *   admin:platform   — admins receiving platform-wide events
 *
 * Usage:
 *   import { setupWebSocket, broadcast } from "./websocket";
 *   setupWebSocket(httpServer);
 *   broadcast("order:123", WS_EVENTS.ORDER_STATUS_UPDATED, payload);
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { IncomingMessage } from "http";
import {
  WS_EVENTS,
  createWsMessage,
  parseWsMessage,
  parseRoom,
  type WsEventName,
  type WsMessage,
} from "../shared/ws-events";

// ─── Types ───

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  rooms: Set<string>;
  lastPing: number;
  userId?: string;
  role?: "customer" | "store" | "driver" | "admin";
}

// ─── State ───

const clients = new Map<string, ConnectedClient>();
const rooms = new Map<string, Set<string>>(); // room → set of client IDs

let clientIdCounter = 0;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// ─── Public API ───

/**
 * Attach WebSocket upgrade handling to an existing HTTP server.
 */
export function setupWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP upgrade
  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    // Only handle /ws path
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Handle new connections
  wss.on("connection", (ws: WebSocket, _request: IncomingMessage) => {
    const clientId = `client_${++clientIdCounter}_${Date.now()}`;
    const client: ConnectedClient = {
      ws,
      id: clientId,
      rooms: new Set(),
      lastPing: Date.now(),
    };

    clients.set(clientId, client);

    // Send connected confirmation
    sendToClient(client, WS_EVENTS.CONNECTED, {
      clientId,
      message: "Connected to LiquorDash real-time service",
      serverTime: new Date().toISOString(),
    });

    console.log(`[ws] Client connected: ${clientId} (total: ${clients.size})`);

    // Handle incoming messages
    ws.on("message", (data) => {
      try {
        const raw = data.toString();
        const msg = parseWsMessage(raw);
        if (!msg) return;

        handleClientMessage(client, msg);
      } catch (err) {
        console.error(`[ws] Error handling message from ${clientId}:`, err);
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      // Remove from all rooms
      for (const room of client.rooms) {
        leaveRoom(client, room);
      }
      clients.delete(clientId);
      console.log(`[ws] Client disconnected: ${clientId} (total: ${clients.size})`);
    });

    ws.on("error", (err) => {
      console.error(`[ws] Client error ${clientId}:`, err.message);
    });
  });

  // Start heartbeat to detect stale connections
  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    const staleThreshold = 60_000; // 60 seconds

    for (const [id, client] of clients) {
      if (now - client.lastPing > staleThreshold) {
        console.log(`[ws] Removing stale client: ${id}`);
        client.ws.terminate();
        for (const room of client.rooms) {
          leaveRoom(client, room);
        }
        clients.delete(id);
      }
    }
  }, 30_000);

  wss.on("close", () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });

  console.log("[ws] WebSocket server attached on /ws");
}

/**
 * Broadcast an event to all clients in a room.
 */
export function broadcast<T>(room: string, event: WsEventName, payload: T): void {
  const roomClients = rooms.get(room);
  if (!roomClients || roomClients.size === 0) return;

  const message = createWsMessage(event, payload, room);
  const serialized = JSON.stringify(message);

  let sent = 0;
  for (const clientId of roomClients) {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
      sent++;
    }
  }

  if (sent > 0) {
    console.log(`[ws] Broadcast ${event} to ${sent} client(s) in ${room}`);
  }
}

/**
 * Broadcast to all clients in rooms matching a pattern.
 * e.g., broadcastToRoomType("admin", event, payload) → sends to all admin:* rooms
 */
export function broadcastToRoomType<T>(
  roomType: string,
  event: WsEventName,
  payload: T,
): void {
  for (const [roomName, roomClients] of rooms) {
    if (roomName.startsWith(`${roomType}:`)) {
      const message = createWsMessage(event, payload, roomName);
      const serialized = JSON.stringify(message);

      for (const clientId of roomClients) {
        const client = clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(serialized);
        }
      }
    }
  }
}

/**
 * Send a message to a specific client.
 */
export function sendToClient<T>(
  client: ConnectedClient,
  event: WsEventName,
  payload: T,
  room?: string,
): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    const message = createWsMessage(event, payload, room);
    client.ws.send(JSON.stringify(message));
  }
}

/**
 * Get the number of connected clients.
 */
export function getConnectionCount(): number {
  return clients.size;
}

/**
 * Get the number of clients in a specific room.
 */
export function getRoomSize(room: string): number {
  return rooms.get(room)?.size ?? 0;
}

/**
 * Get all active rooms and their sizes.
 */
export function getActiveRooms(): Array<{ room: string; size: number }> {
  const result: Array<{ room: string; size: number }> = [];
  for (const [room, clientSet] of rooms) {
    if (clientSet.size > 0) {
      result.push({ room, size: clientSet.size });
    }
  }
  return result;
}

// ─── Internal helpers ───

function handleClientMessage(client: ConnectedClient, msg: WsMessage): void {
  switch (msg.event) {
    case WS_EVENTS.JOIN_ROOM: {
      const room = (msg.payload as { room: string }).room;
      if (room && parseRoom(room)) {
        joinRoom(client, room);
      } else {
        sendToClient(client, WS_EVENTS.ERROR, {
          message: `Invalid room: ${room}`,
        });
      }
      break;
    }

    case WS_EVENTS.LEAVE_ROOM: {
      const room = (msg.payload as { room: string }).room;
      if (room) {
        leaveRoom(client, room);
      }
      break;
    }

    case WS_EVENTS.PING: {
      client.lastPing = Date.now();
      sendToClient(client, WS_EVENTS.PONG, {
        serverTime: new Date().toISOString(),
      });
      break;
    }

    default:
      // Unknown event — ignore
      break;
  }
}

function joinRoom(client: ConnectedClient, room: string): void {
  client.rooms.add(room);

  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room)!.add(client.id);

  console.log(`[ws] ${client.id} joined room ${room} (room size: ${rooms.get(room)!.size})`);
}

function leaveRoom(client: ConnectedClient, room: string): void {
  client.rooms.delete(room);

  const roomClients = rooms.get(room);
  if (roomClients) {
    roomClients.delete(client.id);
    if (roomClients.size === 0) {
      rooms.delete(room);
    }
  }
}
