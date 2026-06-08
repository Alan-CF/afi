import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  fetchFanEventAttendees,
  fetchFanEventDetail,
  subscribeToFanEventAttendees,
  type FanEventAttendee,
  type FanEventDetail,
  type FanEventImage,
} from "../lib/eventsApi";
import {
  getSeedFanEventDetail,
  isSeedFanEventId,
  type SeedFanEventDetail,
} from "../lib/seedFanEventDetails";

export interface UseEventDetailResult {
  event: FanEventDetail | null;
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  isAttending: boolean;
  refresh: () => Promise<void>;
  refreshAttendees: () => Promise<void>;
}

function seedToFanEventDetail(seed: SeedFanEventDetail): FanEventDetail {
  const images: FanEventImage[] = seed.galleryImageUrls.map((url, index) => ({
    id: index,
    fanEventId: 0,
    imageUrl: url,
    storagePath: "",
    sortOrder: index,
  }));

  const attendees: FanEventAttendee[] = seed.attendees.map((attendee) => ({
    id: attendee.id,
    fanEventId: seed.id,
    profileId: attendee.id,
    status: "going",
    createdAt: seed.startAt,
    username: attendee.username,
    avatarUrl: attendee.avatarUrl,
    frameId: null,
  }));

  return {
    source: "seed",
    id: 0,
    seedId: seed.id,
    title: seed.title,
    description: seed.description,
    imageUrl: seed.coverImageUrl,
    mainImagePath: null,
    startAt: seed.startAt,
    endAt: seed.endAt,
    venue: seed.venue,
    address: seed.address,
    city: seed.city,
    state: seed.state,
    country: seed.country,
    countryCode: seed.countryCode,
    lat: seed.lat,
    lng: seed.lng,
    category: null,
    highlights: seed.highlights,
    tags: seed.tags,
    capacity: seed.capacity,
    isPublic: seed.isPublic,
    organizerProfileId: seed.organizer.id,
    organizer: {
      id: seed.organizer.id,
      username: seed.organizer.username,
      avatarUrl: seed.organizer.avatarUrl,
      name: seed.organizer.name,
      points: seed.organizer.points ?? null,
      streak: seed.organizer.streak ?? null,
      rank: seed.organizer.rank ?? null,
    },
    organizerBio: seed.organizer.bio,
    images,
    attendees,
    goingCount: Math.max(seed.goingCount, attendees.length),
  };
}

function resolveTarget(rawId: string | null): {
  kind: "db" | "seed" | "invalid";
  dbId: number | null;
  seed: SeedFanEventDetail | null;
} {
  if (!rawId) return { kind: "invalid", dbId: null, seed: null };
  if (isSeedFanEventId(rawId)) {
    const seed = getSeedFanEventDetail(rawId);
    if (!seed) return { kind: "invalid", dbId: null, seed: null };
    return { kind: "seed", dbId: null, seed };
  }
  const parsed = Number.parseInt(rawId, 10);
  if (!Number.isFinite(parsed) || String(parsed) !== rawId) {
    return { kind: "invalid", dbId: null, seed: null };
  }
  return { kind: "db", dbId: parsed, seed: null };
}

export function useEventDetail(rawId: string | null): UseEventDetailResult {
  const target = useMemo(() => resolveTarget(rawId), [rawId]);
  const [event, setEvent] = useState<FanEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (target.kind === "invalid") {
      setEvent(null);
      setError("Event not found.");
      setLoading(false);
      return;
    }
    if (target.kind === "seed" && target.seed) {
      setLoading(true);
      setError(null);
      setEvent(seedToFanEventDetail(target.seed));
      setLoading(false);
      return;
    }
    if (target.dbId == null) {
      setEvent(null);
      setError("Event not found.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFanEventDetail(target.dbId);
      if (!data) {
        setEvent(null);
        setError("Event not found.");
      } else {
        setEvent(data);
      }
    } catch (err) {
      console.error("useEventDetail load:", err);
      setError(err instanceof Error ? err.message : "Could not load event.");
    } finally {
      setLoading(false);
    }
  }, [target]);

  const refreshAttendees = useCallback(async () => {
    if (target.kind !== "db" || target.dbId == null) return;
    try {
      const attendees = await fetchFanEventAttendees(target.dbId);
      const goingCount = attendees.filter((a) => a.status === "going").length;
      setEvent((current) =>
        current ? { ...current, attendees, goingCount } : current
      );
    } catch (err) {
      console.error("useEventDetail refreshAttendees:", err);
    }
  }, [target]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setCurrentUserId(user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (target.kind !== "db" || target.dbId == null) return;
    const unsubscribe = subscribeToFanEventAttendees(target.dbId, () => {
      void refreshAttendees();
    });
    return unsubscribe;
  }, [target, refreshAttendees]);

  const isAttending =
    !!event &&
    !!currentUserId &&
    event.source === "db" &&
    event.attendees.some(
      (a) => a.profileId === currentUserId && a.status === "going"
    );

  return {
    event,
    loading,
    error,
    currentUserId,
    isAttending,
    refresh: load,
    refreshAttendees,
  };
}
