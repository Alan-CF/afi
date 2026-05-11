import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BaseProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
}

export interface PricedProduct extends BaseProduct {
  image_url: string | null;
  meta_data: Record<string, unknown>;
}

interface DetailedPricedProductRow {
  id: number;
  name: string;
  description: string;
  main_image_url: string | null;
  secondary_images_url: string | null;
  image_priority: number;
  product_details: Record<string, unknown>;
  price: number;
  discount: number;
}

export interface DetailedPricedProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  product_details: Record<string, unknown>;
  imageUrls: string[];
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

function buildDetailedPricedProduct(
  rows: DetailedPricedProductRow[] | null
): DetailedPricedProduct | null {
  if (!rows || rows.length === 0) {
    return null;
  }

  const sortedRows = [...rows].sort(
    (left, right) => left.image_priority - right.image_priority
  );
  const firstRow = sortedRows[0];
  const imageUrls = sortedRows.flatMap((row) =>
    [row.main_image_url, row.secondary_images_url].filter(
      (url): url is string => Boolean(url && url.trim())
    )
  );

  return {
    id: firstRow.id,
    name: firstRow.name,
    description: firstRow.description,
    price: firstRow.price,
    discount: firstRow.discount,
    product_details: firstRow.product_details,
    imageUrls: [...new Set(imageUrls)],
  };
}

export default function useShopProducts(options?: UseShopProductsOptions) {
  const searchQuery = options?.searchQuery ?? '';
  const filters = options?.filters ?? {};
  const enabled = options?.enabled ?? true;
  const filtersKey = JSON.stringify(filters);
  const filtersSnapshot = useMemo(
    () => JSON.parse(filtersKey) as ShopProductFilters,
    [filtersKey]
  );

  const [products, setProducts] = useState<PricedProduct[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(
    async (overrides?: {
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
      const nextFilters = overrides?.filters ?? filtersSnapshot;

      try {
        setLoading(true);

        const { data, error } = await supabase.rpc('get_priced_products', {
          p_search_query: nextSearchQuery.trim(),
          p_filters: nextFilters,
        });

        if (error) {
          throw error;
        }

        setProducts((data ?? []) as PricedProduct[]);
        setError(null);
      } catch (err) {
        console.error('Error in useShopProducts hook:', err);
        setProducts([]);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch products')
        );
      } finally {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [enabled, searchQuery, filtersSnapshot]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    hasLoadedOnce,
    error,
    refreshProducts: fetchProducts,
  };
}

export function useShopProductsByIds(productIds: number[] | null) {
  const [products, setProducts] = useState<PricedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const productIdsKey = JSON.stringify(productIds ?? []);

  const fetchProductsByIds = useCallback(async (ids: number[] | null) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_priced_products_by_id', {
        p_ids: ids ?? [],
      });

      if (error) {
        throw error;
      }

      setProducts((data ?? []) as PricedProduct[]);
      setError(null);
    } catch (err) {
      console.error('Error in useShopProductsByIds hook:', err);
      setProducts([]);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch products')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ids = JSON.parse(productIdsKey) as number[];
    void fetchProductsByIds(ids.length > 0 ? ids : null);
  }, [productIdsKey, fetchProductsByIds]);

  return {
    products,
    loading,
    error,
    refreshProducts: fetchProductsByIds,
  };
}

export function useDetailedProduct(productId: number | null) {
  const [product, setProduct] = useState<DetailedPricedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductDetails = useCallback(async (id: number | null) => {
    if (id === null) {
      setProduct(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(
        'get_detailed_priced_product',
        {
          p_id: id,
        }
      );

      if (error) {
        throw error;
      }

      console.log('useDetailedProduct - raw data:', data);
      setProduct(
        buildDetailedPricedProduct(data as DetailedPricedProductRow[] | null)
      );
      setError(null);
    } catch (err) {
      console.error('Error in useDetailedProduct hook:', err);
      setProduct(null);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to fetch product details')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProductDetails(productId);
  }, [productId, fetchProductDetails]);

  return {
    product,
    loading,
    error,
    refreshProduct: fetchProductDetails,
  };
}
