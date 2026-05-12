import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type PointLog = {
  id: string;
  points: number;
  created_at: string;
  event_key: string;
  label: string;
  description: string;
};

export function usePointLogs(limit = 5) {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logsData } = await supabase
        .from("point_logs")
        .select("id, points, created_at, event_key")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

        const { data: eventsData } = await supabase
        .from("point_events")
        .select("key, label, description");

        const eventsMap: Record<string, { label: string; description: string }> = {};
        (eventsData ?? []).forEach((e: any) => { eventsMap[e.key] = e; });

        setLogs(
        (logsData ?? []).map((d: any) => ({
            id: d.id,
            points: d.points,
            created_at: d.created_at,
            event_key: d.event_key,
            label: eventsMap[d.event_key]?.label ?? d.event_key,
            description: eventsMap[d.event_key]?.description ?? "",
        }))
        );
      setLoading(false);
    };
    fetch();
  }, [limit]);

  return { logs, loading };
}