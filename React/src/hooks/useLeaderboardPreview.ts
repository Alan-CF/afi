import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";

export interface LeaderboardEntry {
  rank: number;
  profileId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
}

export interface LeaderboardPreviewData {
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export function useLeaderboardPreview(topN = 3) {
  const [data, setData] = useState<LeaderboardPreviewData>({ top: [], me: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const session = await getSession();
        const meId = session?.user?.id ?? null;

        const { data: all, error: qErr } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, fanatic_coins")
          .order("fanatic_coins", { ascending: false });

        if (qErr) throw qErr;
        if (cancelled) return;

        const ranked: LeaderboardEntry[] = (all ?? []).map((p, i) => ({
          rank: i + 1,
          profileId: p.id,
          username: p.username,
          avatarUrl: p.avatar_url,
          points: p.fanatic_coins ?? 0,
        }));

        setData({
          top: ranked.slice(0, topN),
          me: meId ? ranked.find((r) => r.profileId === meId) ?? null : null,
        });
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [topN]);

  return { ...data, loading, error };
}
