import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { resolveFrameImage } from "../data/frames";

export type Frame = {
  id: string;
  name: string;
  image_path: string;
  imageUrl: string | null;
  price: number;
  sort_order: number;
};

export type EshopState = {
  frames: Frame[];
  owned: Set<string>;
  selectedFrameId: string | null;
  eCoins: number;
  loading: boolean;
  error: string | null;
};

async function loadEshop(profileId: string | null): Promise<Omit<EshopState, "loading" | "error">> {
  const framesPromise = supabase
    .from("frames")
    .select("id, name, image_path, price, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const profilePromise = profileId
    ? supabase
        .from("profiles")
        .select("e_coins, selected_frame_id")
        .eq("id", profileId)
        .single()
    : Promise.resolve({ data: null, error: null } as const);

  const ownedPromise = profileId
    ? supabase
        .from("owned_frames")
        .select("frame_id")
        .eq("profile_id", profileId)
    : Promise.resolve({ data: [], error: null } as const);

  const [framesRes, profileRes, ownedRes] = await Promise.all([
    framesPromise,
    profilePromise,
    ownedPromise,
  ]);

  if (framesRes.error) throw framesRes.error;
  if (profileRes.error) throw profileRes.error;
  if (ownedRes.error) throw ownedRes.error;

  const frames: Frame[] = (framesRes.data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    image_path: row.image_path,
    imageUrl: resolveFrameImage(row.image_path),
    price: row.price,
    sort_order: row.sort_order,
  }));

  return {
    frames,
    owned: new Set((ownedRes.data ?? []).map((r: any) => r.frame_id)),
    eCoins: profileRes.data?.e_coins ?? 0,
    selectedFrameId: profileRes.data?.selected_frame_id ?? null,
  };
}

export function useEshop() {
  const [state, setState] = useState<EshopState>({
    frames: [],
    owned: new Set(),
    selectedFrameId: null,
    eCoins: 0,
    loading: true,
    error: null,
  });
  const [profileId, setProfileId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const id = user?.id ?? null;
      setProfileId(id);
      const result = await loadEshop(id);
      setState({ ...result, loading: false, error: null });
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message ?? "Failed to load eShop" }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = useCallback(
    async (frameId: string): Promise<{ ok: true; eCoins: number } | { ok: false; reason: string }> => {
      const { data, error } = await supabase.rpc("purchase_frame", { p_frame_id: frameId });
      if (error) {
        return { ok: false, reason: parsePurchaseError(error.message) };
      }
      const newBalance = (data as any)?.e_coins ?? state.eCoins;
      setState((s) => ({
        ...s,
        eCoins: newBalance,
        owned: new Set([...s.owned, frameId]),
      }));
      window.dispatchEvent(new CustomEvent("profile-updated"));
      return { ok: true, eCoins: newBalance };
    },
    [state.eCoins]
  );

  const selectFrame = useCallback(
    async (frameId: string | null): Promise<{ ok: true } | { ok: false; reason: string }> => {
      const { error } = await supabase.rpc("select_frame", { p_frame_id: frameId });
      if (error) return { ok: false, reason: error.message };
      setState((s) => ({ ...s, selectedFrameId: frameId }));
      window.dispatchEvent(new CustomEvent("profile-updated"));
      return { ok: true };
    },
    []
  );

  return { ...state, profileId, refresh, purchase, selectFrame };
}

function parsePurchaseError(message: string): string {
  if (message.includes("insufficient_balance")) return "Not enough e-coins.";
  if (message.includes("already_owned")) return "You already own this frame.";
  if (message.includes("frame_not_found")) return "Frame not available.";
  if (message.includes("not_authenticated")) return "Please sign in first.";
  return "Purchase failed. Try again.";
}
