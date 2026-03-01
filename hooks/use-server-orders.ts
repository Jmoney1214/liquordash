/**
 * Server-synced orders hook.
 *
 * When authenticated, order operations go through tRPC to persist in the database.
 * Falls back to local OrdersContext when offline.
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export function useServerOrders() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const ordersQuery = trpc.orders.myOrders.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 1000,
  });

  const createMutation = trpc.orders.create.useMutation({
    onSuccess: () => utils.orders.myOrders.invalidate(),
  });

  return {
    serverOrders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    isAuthenticated: !!user,

    createServerOrder: async (orderData: {
      deliveryMode: "express" | "shipping";
      subtotal: string;
      deliveryFee: string;
      serviceFee?: string;
      tax: string;
      tip?: string;
      total: string;
      deliveryAddress: string;
      estimatedDelivery?: string;
      giftMessage?: string;
      recipientName?: string;
      items: Array<{
        productId: number;
        productName: string;
        productBrand: string;
        productImageUrl?: string;
        price: string;
        quantity: number;
        isGift?: boolean;
        giftMessage?: string;
      }>;
    }) => {
      if (!user) return null;
      return createMutation.mutateAsync(orderData);
    },

    refetch: ordersQuery.refetch,
  };
}

export function useServerOrderDetail(orderId: number) {
  const { user } = useAuth();

  const query = trpc.orders.getById.useQuery(
    { id: orderId },
    {
      enabled: !!user && orderId > 0,
      retry: 1,
      staleTime: 15 * 1000,
    }
  );

  return {
    order: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
