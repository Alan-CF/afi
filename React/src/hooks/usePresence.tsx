import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";

const PresenceContext = createContext<Set<string>>(new Set());

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const idsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let selfId: string | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const apply = (ids: Set<string>) => {
      if (sameSet(ids, idsRef.current)) return;
      idsRef.current = ids;
      setOnlineIds(ids);
    };

    const recompute = () => {
      if (!channel) return;
      try {
        const state = channel.presenceState();
        const ids = new Set<string>(Object.keys(state));
        if (selfId) ids.add(selfId);
        apply(ids);
      } catch {
        void 0;
      }
    };

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      selfId = user.id;

      channel = supabase.channel("online-users", {
        config: { presence: { key: user.id } },
      });

      apply(new Set([user.id]));

      channel
        .on("presence", { event: "sync" }, recompute)
        .on("presence", { event: "join" }, recompute)
        .on("presence", { event: "leave" }, recompute)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && channel) {
            await channel.track({ online_at: new Date().toISOString() });
            recompute();
          }
        });

      heartbeat = setInterval(recompute, 2500);
    }

    void setup();

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
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
