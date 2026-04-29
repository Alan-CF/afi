import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";

export interface HomeGreeting {
  username: string;
  avatarUrl: string | null;
}

export function useHome() {
  const [greeting, setGreeting] = useState<HomeGreeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const session = await getSession();
        if (!session?.user) {
          if (!cancelled) setGreeting(null);
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", session.user.id)
          .single();
        if (error) throw error;
        if (!cancelled) {
          setGreeting({
            username: data.username,
            avatarUrl: data.avatar_url,
          });
        }
      } catch (err) {
        console.error("useHome:", err);
        if (!cancelled) setGreeting(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return { greeting, loading };
}
