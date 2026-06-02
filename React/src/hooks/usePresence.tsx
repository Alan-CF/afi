import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";

// Global online-presence tracking via Supabase Realtime Presence.
// The provider tracks the signed-in user on a shared channel so they count as
// "online" from any page, and exposes the set of online profile ids.
const PresenceContext = createContext<Set<string>>(new Set());

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase.channel("online-users", {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          if (!channel) return;
          const state = channel.presenceState();
          setOnlineIds(new Set(Object.keys(state)));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && channel) {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });
    }

    void setup();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PresenceContext.Provider value={onlineIds}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(): Set<string> {
  return useContext(PresenceContext);
}
