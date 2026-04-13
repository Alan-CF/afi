import { useEffect, useState } from "react";
import { getSession } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

const CART_UPDATED_EVENT = "cart:updated";

function notifyCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

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

export async function addItemToCart(pricedProductId: number) {
  const session = await getSession();
  const profileId = session?.user?.id;

  if (!profileId) {
    throw new Error("You must be signed in to add items to your cart.");
  }

  const { error } = await supabase.rpc("add_item_to_active_cart", {
    p_profile_id: profileId,
    p_priced_product_id: pricedProductId,
  });

  if (error) {
    throw error;
  }

  notifyCartUpdated();
}

export async function removeItemFromCart(cartItemId: number) {
  const session = await getSession();
  const profileId = session?.user?.id;

  if (!profileId) {
    throw new Error("You must be signed in to remove items from your cart.");
  }

  const { error } = await supabase.rpc("remove_item_from_active_cart", {
    p_profile_id: profileId,
    p_cart_item_id: cartItemId,
  });

  if (error) {
    throw error;
  }

  notifyCartUpdated();
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

    if (typeof window === "undefined") {
      return;
    }

    const handleCartUpdated = () => {
      void fetchCart();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, []);

  return {
    cartItems,
    loading,
    hasLoadedOnce,
    error,
    refreshCart: fetchCart,
  };
}
