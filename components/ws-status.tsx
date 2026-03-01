/**
 * WebSocket Connection Status Indicator
 * Shows a small dot/badge indicating real-time connection state.
 */

import { View, Text, StyleSheet } from "react-native";
import { useWebSocket } from "@/hooks/use-websocket";
import type { ConnectionState } from "@/shared/ws-events";

const STATUS_CONFIG: Record<ConnectionState, { color: string; label: string }> = {
  connected: { color: "#22C55E", label: "Live" },
  connecting: { color: "#F59E0B", label: "Connecting" },
  reconnecting: { color: "#F59E0B", label: "Reconnecting" },
  disconnected: { color: "#EF4444", label: "Offline" },
};

interface WsStatusProps {
  showLabel?: boolean;
  size?: "small" | "medium";
}

export function WsStatus({ showLabel = false, size = "small" }: WsStatusProps) {
  const { connectionState } = useWebSocket();
  const config = STATUS_CONFIG[connectionState];
  const dotSize = size === "small" ? 8 : 10;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: config.color,
          },
        ]}
      />
      {showLabel && (
        <Text style={[styles.label, { color: config.color, fontSize: size === "small" ? 10 : 12 }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

/**
 * A banner that appears when the connection is lost.
 */
export function WsOfflineBanner() {
  const { connectionState } = useWebSocket();

  if (connectionState === "connected") return null;

  const config = STATUS_CONFIG[connectionState];

  return (
    <View style={[styles.banner, { backgroundColor: config.color }]}>
      <Text style={styles.bannerText}>
        {connectionState === "reconnecting"
          ? "Reconnecting to live updates..."
          : connectionState === "connecting"
            ? "Connecting..."
            : "You are offline. Live updates paused."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  label: {
    fontWeight: "600",
  },
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
