/**
 * Hook for admin to trigger database seeding.
 */

import { trpc } from "@/lib/trpc";

export function useSeedDatabase() {
  const utils = trpc.useUtils();

  const seedMutation = trpc.admin.seed.useMutation({
    onSuccess: () => {
      // Invalidate all product and category queries after seeding
      utils.products.list.invalidate();
      utils.products.featured.invalidate();
      utils.products.premium.invalidate();
      utils.products.express.invalidate();
      utils.products.shipping.invalidate();
      utils.products.count.invalidate();
      utils.categories.list.invalidate();
    },
  });

  const statsQuery = trpc.admin.stats.useQuery(undefined, {
    retry: 1,
    staleTime: 30 * 1000,
  });

  return {
    seed: () => seedMutation.mutateAsync(),
    isSeeding: seedMutation.isPending,
    seedResult: seedMutation.data,
    seedError: seedMutation.error,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
  };
}
