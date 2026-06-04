import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  price: number;
  discount: number;
  product_details: Record<string, unknown>;
  meta_data: Record<string, unknown>;
  pricing_id: number | null;
}

export function useAdminShop() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("product_catalog")
      .select(`
        id,
        name,
        description,
        image_url,
        is_active,
        product_details,
        meta_data,
        product_pricing (
          id,
          price,
          discount,
          created_at
        )
      `)
      .order("id", { ascending: false });

    if (fetchError) {
      console.error(fetchError);
      setError("Failed to load products.");
      setLoading(false);
      return;
    }

    const mapped: AdminProduct[] = (data ?? []).map((p: any) => {
      const pricing = (p.product_pricing ?? []).reduce(
        (latest: any, curr: any) =>
          !latest || curr.created_at > latest.created_at ? curr : latest,
        null
      );

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        image_url: p.image_url,
        is_active: p.is_active,
        price: pricing?.price ?? 0,
        discount: pricing?.discount ?? 0,
        product_details: p.product_details ?? {},
        meta_data: p.meta_data ?? {},
        pricing_id: pricing?.id ?? null,
      };
    });

    setProducts(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleProduct = async (product: AdminProduct) => {
    const { error } = await supabase
      .from("product_catalog")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) { console.error(error); return; }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: !product.is_active } : p
      )
    );
  };

  const deleteProduct = async (productId: number) => {
    const { error: pricingError } = await supabase
      .from("product_pricing")
      .delete()
      .eq("product_id", productId);

    if (pricingError) { console.error(pricingError); return; }

    const { error } = await supabase
      .from("product_catalog")
      .delete()
      .eq("id", productId);

    if (error) { console.error(error); return; }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateProduct = async (
    product: AdminProduct,
    updates: {
      name?: string;
      description?: string;
      image_url?: string | null;
      price?: number;
      discount?: number;
      product_details?: Record<string, unknown>;
      meta_data?: Record<string, unknown>;
    }
  ) => {
    const catalogFields: any = {};
    if (updates.name !== undefined) catalogFields.name = updates.name;
    if (updates.description !== undefined) catalogFields.description = updates.description;
    if (updates.image_url !== undefined) catalogFields.image_url = updates.image_url;
    if (updates.product_details !== undefined) catalogFields.product_details = updates.product_details;
    if (updates.meta_data !== undefined) catalogFields.meta_data = updates.meta_data;

    if (Object.keys(catalogFields).length > 0) {
      const { error } = await supabase
        .from("product_catalog")
        .update(catalogFields)
        .eq("id", product.id);
      if (error) { console.error(error); return; }
    }

    if (updates.price !== undefined || updates.discount !== undefined) {
      const { error } = await supabase
        .from("product_pricing")
        .insert({
          product_id: product.id,
          price: updates.price ?? product.price,
          discount: updates.discount ?? product.discount,
        });
      if (error) { console.error(error); return; }
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, ...updates } : p
      )
    );
  };

  const createProduct = async (fields: {
    name: string;
    description: string;
    image_url: string | null;
    price: number;
    discount: number;
    product_details: Record<string, unknown>;
    meta_data: Record<string, unknown>;
  }) => {
    const { data: productData, error: productError } = await supabase
      .from("product_catalog")
      .insert({
        name: fields.name,
        description: fields.description,
        image_url: fields.image_url,
        is_active: true,
        product_details: fields.product_details,
        meta_data: fields.meta_data,
      })
      .select()
      .single();

    if (productError || !productData) {
      console.error(productError);
      return false;
    }

    const { error: pricingError } = await supabase
      .from("product_pricing")
      .insert({
        product_id: productData.id,
        price: fields.price,
        discount: fields.discount,
      });

    if (pricingError) {
      console.error(pricingError);
      return false;
    }

    await fetchProducts();
    return true;
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    toggleProduct,
    deleteProduct,
    updateProduct,
    createProduct,
  };
}