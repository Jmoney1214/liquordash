/**
 * API hooks that bridge tRPC backend with local data fallback.
 *
 * When the user is authenticated and the server is reachable, data comes from
 * the PostgreSQL database via tRPC. Otherwise, the app falls back to the local
 * static dataset so it works fully offline / in Expo Go without a server.
 */

import { trpc } from "@/lib/trpc";
import {
  PRODUCTS,
  CATEGORIES,
  getFeaturedProducts as localFeatured,
  getPremiumProducts as localPremium,
  getExpressProducts as localExpress,
  getShippingProducts as localShipping,
  getProductsByCategory as localByCategory,
  searchProducts as localSearch,
  getProductById as localGetById,
  type Product,
  type CategoryInfo,
  type Category,
} from "@/lib/data";

// ─── Helpers to normalize DB rows to the local Product shape ───

function dbRowToProduct(row: any): Product {
  return {
    id: String(row.id),
    name: row.name,
    brand: row.brand,
    category: row.categorySlug as Category,
    price: parseFloat(row.price),
    originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
    volume: row.volume,
    abv: row.abv,
    rating: parseFloat(row.rating),
    reviewCount: row.reviewCount,
    imageUrl: row.imageUrl,
    description: row.description,
    tastingNotes: row.tastingNotes ?? "",
    pairings: row.pairings ?? "",
    expressAvailable: row.expressAvailable,
    shippingAvailable: row.shippingAvailable,
    shippingDays: row.shippingDays ?? "",
    inStock: row.inStock,
    featured: row.featured,
    premium: row.premium,
  };
}

function dbRowToCategory(row: any): CategoryInfo {
  return {
    id: row.slug as Category,
    name: row.name,
    icon: row.icon,
    color: row.color,
  };
}

// ─── Product hooks ───

export function useProducts() {
  const query = trpc.products.list.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  return {
    products: query.data ? query.data.map(dbRowToProduct) : PRODUCTS,
    isLoading: query.isLoading,
    isFromServer: !!query.data,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCategories() {
  const query = trpc.categories.list.useQuery(undefined, {
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  return {
    categories: query.data ? query.data.map(dbRowToCategory) : CATEGORIES,
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function useFeaturedProducts() {
  const query = trpc.products.featured.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data ? query.data.map(dbRowToProduct) : localFeatured(),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function usePremiumProducts() {
  const query = trpc.products.premium.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data ? query.data.map(dbRowToProduct) : localPremium(),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function useExpressProducts() {
  const query = trpc.products.express.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data ? query.data.map(dbRowToProduct) : localExpress(),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function useShippingProducts() {
  const query = trpc.products.shipping.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data ? query.data.map(dbRowToProduct) : localShipping(),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function useProductsByCategory(categorySlug: string) {
  const query = trpc.products.byCategory.useQuery(
    { categorySlug },
    {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      enabled: !!categorySlug,
    }
  );

  return {
    products: query.data
      ? query.data.map(dbRowToProduct)
      : localByCategory(categorySlug as Category),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function useProductSearch(queryStr: string) {
  const query = trpc.products.search.useQuery(
    { query: queryStr },
    {
      retry: 1,
      staleTime: 2 * 60 * 1000,
      enabled: queryStr.length > 0,
    }
  );

  return {
    products: query.data ? query.data.map(dbRowToProduct) : localSearch(queryStr),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

export function useProductById(id: string) {
  const numId = parseInt(id, 10);
  const query = trpc.products.getById.useQuery(
    { id: numId },
    {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      enabled: !isNaN(numId),
    }
  );

  return {
    product: query.data ? dbRowToProduct(query.data) : localGetById(id),
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}

// ─── Product count (for admin) ───

export function useProductCount() {
  const query = trpc.products.count.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    count: query.data ?? PRODUCTS.length,
    isLoading: query.isLoading,
    isFromServer: !!query.data,
  };
}
