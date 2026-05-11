import { useCallback, useEffect, useState } from 'react';
import { getSession } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

const CART_UPDATED_EVENT = 'cart:updated';

function notifyCartUpdated() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export interface CartItem {
  id: number;
  product_name: string;
  product_description: string;
  is_active: boolean;
  price: number;
  discount: number;
  details: Record<string, string>;
  image_url: string | null;
}

async function addItemToCartRequest(
  pricedProductId: number,
  productDetails: Record<string, string> = {}
) {
  const session = await getSession();
  const profileId = session?.user?.id;

  if (!profileId) {
    throw new Error('You must be signed in to add items to your cart.');
  }

  const { error } = await supabase.rpc('add_item_to_cart', {
    p_profile_id: profileId,
    p_priced_product_id: pricedProductId,
    p_product_details: productDetails,
  });

  if (error) {
    throw error;
  }

  notifyCartUpdated();
}

export function useAddItemToCart() {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<Error | null>(null);

  const addItemToCart = useCallback(
    async (
      pricedProductId: number,
      productDetails: Record<string, string> = {}
    ) => {
      try {
        setIsAddingToCart(true);
        setAddToCartError(null);
        await addItemToCartRequest(pricedProductId, productDetails);
        return true;
      } catch (error) {
        const parsedError =
          error instanceof Error
            ? error
            : new Error('Failed to add item to cart.');
        setAddToCartError(parsedError);
        return false;
      } finally {
        setIsAddingToCart(false);
      }
    },
    []
  );

  return {
    addItemToCart,
    isAddingToCart,
    addToCartError,
  };
}

export async function removeItemFromCart(cartItemId: number) {
  const session = await getSession();
  const profileId = session?.user?.id;

  if (!profileId) {
    throw new Error('You must be signed in to remove items from your cart.');
  }

  const { error } = await supabase.rpc('remove_item_from_active_cart', {
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

      const { data, error } = await supabase.rpc('get_cart', {
        p_profile_id: profileId,
      });

      if (error) {
        throw error;
      }

      setCartItems((data ?? []) as CartItem[]);
      setError(null);
    } catch (err) {
      console.error('Error in useCart hook:', err);
      setCartItems([]);
      setError(err instanceof Error ? err : new Error('Failed to fetch cart'));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchCart();

    if (typeof window === 'undefined') {
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

export function useCartItem(cartItemId: number) {
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCartItem = async () => {
      try {
        setLoading(true);

        const session = await getSession();
        const profileId = session?.user?.id;

        if (!profileId) {
          setCartItem(null);
          setError(null);
          return;
        }

        const { data, error } = await supabase.rpc('get_cart_item', {
          p_profile_id: profileId,
          p_cart_item_id: cartItemId,
        });

        if (error) {
          throw error;
        }

        const item = data as CartItem;

        setCartItem(item);
        setError(null);
      } catch (err) {
        console.error('Error in useCartItem hook:', err);

        setCartItem(null);

        setError(
          err instanceof Error ? err : new Error('Failed to fetch cart item')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCartItem();
  }, [cartItemId]);

  return {
    cartItem,
    loading,
    error,
  };
}

export function useUpdateCartItemDetails(
  cartItemId: number,
  productDetails: Record<string, string>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCartItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await getSession();
      const profileId = session?.user?.id;

      if (!profileId) {
        throw new Error('You must be signed in to update cart item details.');
      }

      const { error } = await supabase.rpc('update_cart_item_details', {
        p_profile_id: profileId,
        p_cart_item_id: cartItemId,
        p_product_details: productDetails,
      });

      if (error) {
        throw error;
      }

      notifyCartUpdated();
    } catch (err) {
      console.error('Error in useUpdateCartItemDetails hook:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to update cart item details')
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    updateCartItemDetails,
    loading,
    error,
  };
}
