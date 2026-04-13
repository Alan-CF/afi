import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface Collection {
  name: string;
  image_url: string;
}

export interface Player {
  name: string;
  number: number;
  position: string;
  image_url: string;
}

export interface Category {
  name: string;
  image_url: string;
}

function useShopGroup<T>(rpcName: string, fetchErrorMessage: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(rpcName);

      if (error) {
        throw error;
      }

      setItems(Array.isArray(data) ? (data as T[]) : []);
      setError(null);
    } catch (err) {
      console.error(`Error in ${rpcName}:`, err);
      setError(err instanceof Error ? err : new Error(fetchErrorMessage));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    hasLoadedOnce,
    error,
    refresh: fetchItems,
  };
}

export function useCollections() {
  const result = useShopGroup<Collection>("get_shop_collections", "Failed to fetch collections");

  return {
    collections: result.items,
    loading: result.loading,
    hasLoadedOnce: result.hasLoadedOnce,
    error: result.error,
    refreshCollections: result.refresh,
  };
}

export function usePlayers() {
  const result = useShopGroup<Player>("get_shop_players", "Failed to fetch players");

  return {
    players: result.items,
    loading: result.loading,
    hasLoadedOnce: result.hasLoadedOnce,
    error: result.error,
    refreshPlayers: result.refresh,
  };
}

export function useCategories() {
  const result = useShopGroup<Category>("get_shop_categories", "Failed to fetch categories");

  return {
    categories: result.items,
    loading: result.loading,
    hasLoadedOnce: result.hasLoadedOnce,
    error: result.error,
    refreshCategories: result.refresh,
  };
}

export function useShopFilters() {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase.rpc("get_product_filters");

        if (error) {
          throw error;
        }

        setFilters((data ?? {}) as Record<string, string[]>);
        setError(null);
      } catch (err) {
        console.error("Error fetching product filters:", err);
        setFilters({});
        setError(err instanceof Error ? err : new Error("Failed to fetch product filters"));
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  return {
    filters,
    loading,
    error,
  };
}
