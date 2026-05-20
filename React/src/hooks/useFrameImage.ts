import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { resolveFrameImage } from "../data/frames";

const cache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

async function loadFrameImage(frameId: string): Promise<string | null> {
  if (cache.has(frameId)) return cache.get(frameId)!;
  if (pending.has(frameId)) return pending.get(frameId)!;

  const promise = (async () => {
    const { data, error } = await supabase
      .from("frames")
      .select("image_path")
      .eq("id", frameId)
      .maybeSingle();
    const url = error || !data ? null : resolveFrameImage(data.image_path);
    cache.set(frameId, url);
    pending.delete(frameId);
    return url;
  })();

  pending.set(frameId, promise);
  return promise;
}

export function useFrameImage(frameId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    frameId ? cache.get(frameId) ?? null : null
  );

  useEffect(() => {
    if (!frameId) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    loadFrameImage(frameId).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [frameId]);

  return url;
}
