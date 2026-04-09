import { useEffect, useState } from "react";
import { getSession } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

export interface CartItem {
  id: number;
  product_name: string;
  product_description: string;
  stock: number;
  is_active: boolean;
  price: number;
  discount: number;
  image_url: string | null;
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);

      const session = await getSession();
      const profileId = session?.user?.id;

      if (!profileId) {
        setCartItems([]);
        setError(null);
        return;
      }

      const { data, error } = await supabase.rpc("get_cart", {
        p_profile_id: profileId,
      });
    
      if (error) {
        throw error;
      }

      setCartItems((data ?? []) as CartItem[]);
      setError(null);
    } catch (err) {
      console.error("Error in useCart hook:", err);
      setCartItems([]);
      setError(err instanceof Error ? err : new Error("Failed to fetch cart"));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return {
    cartItems,
    loading,
    hasLoadedOnce,
    error,
    refreshCart: fetchCart,
  };
}
