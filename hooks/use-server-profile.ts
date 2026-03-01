/**
 * Server-synced profile, addresses, and payment method hooks.
 *
 * When authenticated, user profile data is persisted to the database via tRPC.
 * Falls back to local CustomerContext when offline.
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

// ─── Profile ───

export function useServerProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isAuthenticated: !!user,

    updateProfile: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
      isAgeVerified?: boolean;
      notifPush?: boolean;
      notifEmail?: boolean;
      notifSms?: boolean;
    }) => {
      if (!user) return;
      updateMutation.mutate(data);
    },

    refetch: profileQuery.refetch,
  };
}

// ─── Addresses ───

export function useServerAddresses() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const addressesQuery = trpc.addresses.list.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const addMutation = trpc.addresses.add.useMutation({
    onSuccess: () => utils.addresses.list.invalidate(),
  });

  const updateMutation = trpc.addresses.update.useMutation({
    onSuccess: () => utils.addresses.list.invalidate(),
  });

  const deleteMutation = trpc.addresses.delete.useMutation({
    onSuccess: () => utils.addresses.list.invalidate(),
  });

  return {
    addresses: addressesQuery.data ?? [],
    isLoading: addressesQuery.isLoading,
    isAuthenticated: !!user,

    addAddress: (data: {
      label: string;
      fullName: string;
      street: string;
      apt?: string;
      city: string;
      state: string;
      zip: string;
      phone?: string;
      instructions?: string;
      isDefault?: boolean;
    }) => {
      if (!user) return;
      addMutation.mutate(data);
    },

    updateAddress: (data: {
      id: number;
      label?: string;
      fullName?: string;
      street?: string;
      apt?: string;
      city?: string;
      state?: string;
      zip?: string;
      phone?: string;
      instructions?: string;
      isDefault?: boolean;
    }) => {
      if (!user) return;
      updateMutation.mutate(data);
    },

    deleteAddress: (id: number) => {
      if (!user) return;
      deleteMutation.mutate({ id });
    },

    refetch: addressesQuery.refetch,
  };
}

// ─── Payment Methods ───

export function useServerPayments() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const paymentsQuery = trpc.payments.list.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const addMutation = trpc.payments.add.useMutation({
    onSuccess: () => utils.payments.list.invalidate(),
  });

  const deleteMutation = trpc.payments.delete.useMutation({
    onSuccess: () => utils.payments.list.invalidate(),
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    isAuthenticated: !!user,

    addPayment: (data: {
      type: "card" | "apple-pay" | "google-pay";
      brand?: string;
      last4?: string;
      expiry?: string;
      holderName?: string;
      isDefault?: boolean;
    }) => {
      if (!user) return;
      addMutation.mutate(data);
    },

    deletePayment: (id: number) => {
      if (!user) return;
      deleteMutation.mutate({ id });
    },

    refetch: paymentsQuery.refetch,
  };
}

// ─── Favorites ───

export function useServerFavorites() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const favoritesQuery = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 1000,
  });

  const addMutation = trpc.favorites.add.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });

  const removeMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });

  return {
    favorites: favoritesQuery.data ?? [],
    isLoading: favoritesQuery.isLoading,
    isAuthenticated: !!user,

    addFavorite: (productId: number) => {
      if (!user) return;
      addMutation.mutate({ productId });
    },

    removeFavorite: (productId: number) => {
      if (!user) return;
      removeMutation.mutate({ productId });
    },

    refetch: favoritesQuery.refetch,
  };
}
