import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "afi.seedAttend.";

function keyFor(seedId: string): string {
  return `${STORAGE_PREFIX}${seedId}`;
}

function read(seedId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(keyFor(seedId)) === "1";
  } catch {
    return false;
  }
}

function write(seedId: string, attending: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (attending) {
      window.localStorage.setItem(keyFor(seedId), "1");
    } else {
      window.localStorage.removeItem(keyFor(seedId));
    }
  } catch (_err) {
    void _err;
  }
}

export function listAttendingSeedIds(): Set<string> {
  const result = new Set<string>();
  if (typeof window === "undefined") return result;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const value = window.localStorage.getItem(key);
      if (value === "1") {
        result.add(key.slice(STORAGE_PREFIX.length));
      }
    }
  } catch (_err) {
    void _err;
  }
  return result;
}

export interface UseSeedAttendanceResult {
  isAttending: boolean;
  toggle: () => Promise<void>;
  setAttending: (next: boolean) => Promise<void>;
}

export function useSeedAttendance(
  seedId: string | null
): UseSeedAttendanceResult {
  const [isAttending, setIsAttendingState] = useState(false);

  useEffect(() => {
    if (!seedId) {
      setIsAttendingState(false);
      return;
    }
    setIsAttendingState(read(seedId));
  }, [seedId]);

  useEffect(() => {
    if (!seedId) return;
    function onStorage(event: StorageEvent) {
      if (event.key === keyFor(seedId ?? "")) {
        setIsAttendingState(event.newValue === "1");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [seedId]);

  const setAttending = useCallback(
    async (next: boolean) => {
      if (!seedId) return;
      write(seedId, next);
      setIsAttendingState(next);
    },
    [seedId]
  );

  const toggle = useCallback(async () => {
    await setAttending(!isAttending);
  }, [isAttending, setAttending]);

  return { isAttending, toggle, setAttending };
}
