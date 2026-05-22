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

export function usePointLogs(limit = 10) {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

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

        channel = supabase
        .channel("point-logs-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "point_logs",
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            const newLog = payload.new as any;

            const formattedLog: PointLog = {
              id: newLog.id,
              points: newLog.points,
              created_at: newLog.created_at,
              event_key: newLog.event_key,
              label:
                eventsMap[newLog.event_key]?.label ??
                newLog.event_key,
              description:
                eventsMap[newLog.event_key]?.description ?? "",
            };

            setLogs((prev) =>
              [formattedLog, ...prev].slice(0, limit)
            );
          }
        )
        .subscribe();
      setLoading(false);
    };
    fetch();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [limit]);

  return { logs, loading };
}