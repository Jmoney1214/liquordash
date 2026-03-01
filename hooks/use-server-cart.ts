/**
 * Server-synced cart hook.
 *
 * When authenticated, cart operations go through tRPC to persist in the database.
 * The local CartContext remains the primary source of truth for the UI, and this
 * hook provides optional server sync capabilities.
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export function useServerCart() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const cartQuery = trpc.cart.get.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 1000,
  });

  const addMutation = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  return {
    serverCart: cartQuery.data ?? [],
    isLoading: cartQuery.isLoading,
    isAuthenticated: !!user,

    addToServerCart: (productId: number, quantity: number = 1) => {
      if (!user) return;
      addMutation.mutate({ productId, quantity });
    },

    updateServerCartQuantity: (cartItemId: number, quantity: number) => {
      if (!user) return;
      updateQuantityMutation.mutate({ cartItemId, quantity });
    },

    removeFromServerCart: (cartItemId: number) => {
      if (!user) return;
      removeMutation.mutate({ cartItemId });
    },

    clearServerCart: () => {
      if (!user) return;
      clearMutation.mutate();
    },

    refetch: cartQuery.refetch,
  };
}
