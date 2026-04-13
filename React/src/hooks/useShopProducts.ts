import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface PricedProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  is_active: boolean;
  stock: number;
  image_url: string | null;
  product_details: Record<string, unknown>;
  meta_data: Record<string, unknown>;
}

export type ShopProductFilters = Record<
  string,
  {
    name?: string | null;
  }
>;

type UseShopProductsOptions = {
  searchQuery?: string;
  filters?: ShopProductFilters;
  enabled?: boolean;
};

export default function useShopProducts(options?: UseShopProductsOptions) {
  const searchQuery = options?.searchQuery ?? "";
  const filters = options?.filters ?? {};
  const enabled = options?.enabled ?? true;
  const filtersKey = JSON.stringify(filters);

  const [products, setProducts] = useState<PricedProduct[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async (overrides?: {
    searchQuery?: string;
    filters?: ShopProductFilters;
  }) => {
    if (!enabled) {
      setProducts([]);
      setError(null);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    const nextSearchQuery = overrides?.searchQuery ?? searchQuery;
    const nextFilters = overrides?.filters ?? filters;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_priced_products", {
        p_search_query: nextSearchQuery.trim(),
        p_filters: nextFilters,
      });

      if (error) {
        throw error;
      }

      setProducts((data ?? []) as PricedProduct[]);
      setError(null);
    } catch (err) {
      console.error("Error in useShopProducts hook:", err);
      setProducts([]);
      setError(err instanceof Error ? err : new Error("Failed to fetch products"));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [enabled, searchQuery, filtersKey]);

  return {
    products,
    loading,
    hasLoadedOnce,
    error,
    refreshProducts: fetchProducts,
  };
}
