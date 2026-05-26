import { supabase } from "../lib/supabaseClient";

export interface FanEvent {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startAt: string;
  endAt: string | null;
  venue: string | null;
  city: string | null;
  country: string;
  capacity: number | null;
  goingCount: number;
  tags: string[];
  organizerProfileId: string | null;
}

type RawRow = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  start_at: string;
  end_at: string | null;
  venue: string | null;
  city: string | null;
  country: string;
  capacity: number | null;
  organizer_profile_id: string | null;
};

function mapRow(row: RawRow, goingCount = 0): FanEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    startAt: row.start_at,
    endAt: row.end_at,
    venue: row.venue,
    city: row.city,
    country: row.country,
    capacity: row.capacity,
    goingCount,
    tags: [],
    organizerProfileId: row.organizer_profile_id,
  };
}

const HIDDEN_DB_EVENT_IDS = new Set<number>([1, 2, 3]);

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function fetchUpcomingFanEvents(limit = 10): Promise<FanEvent[]> {
  const userId = await currentUserId();

  let builder = supabase
    .from("fan_events")
    .select("id, title, description, image_url, start_at, end_at, venue, city, country, capacity, organizer_profile_id")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  builder = userId
    ? builder.or(
        `is_public.eq.true,organizer_profile_id.eq.${userId}`
      )
    : builder.eq("is_public", true);

  const { data, error } = await builder;

  if (error) {
    console.error("fetchUpcomingFanEvents:", error);
    return [];
  }

  const rows = ((data ?? []) as RawRow[]).filter(
    (row) => !HIDDEN_DB_EVENT_IDS.has(row.id)
  );
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data: attendeeRows, error: attendeesError } = await supabase
    .from("fan_event_attendees")
    .select("fan_event_id")
    .in("fan_event_id", ids)
    .eq("status", "going");

  if (attendeesError) {
    console.error("fetchUpcomingFanEvents attendees:", attendeesError);
  }

  const counts = new Map<number, number>();
  for (const row of (attendeeRows ?? []) as { fan_event_id: number }[]) {
    counts.set(row.fan_event_id, (counts.get(row.fan_event_id) ?? 0) + 1);
  }

  return rows.map((row) => mapRow(row, counts.get(row.id) ?? 0));
}

export async function fetchAllPublicFanEvents(limit = 60): Promise<FanEvent[]> {
  const userId = await currentUserId();

  let builder = supabase
    .from("fan_events")
    .select("id, title, description, image_url, start_at, end_at, venue, city, country, capacity, organizer_profile_id")
    .order("start_at", { ascending: false })
    .limit(limit);

  builder = userId
    ? builder.or(
        `is_public.eq.true,organizer_profile_id.eq.${userId}`
      )
    : builder.eq("is_public", true);

  const { data, error } = await builder;

  if (error) {
    console.error("fetchAllPublicFanEvents:", error);
    return [];
  }

  const rows = ((data ?? []) as RawRow[]).filter(
    (row) => !HIDDEN_DB_EVENT_IDS.has(row.id)
  );
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data: attendeeRows, error: attendeesError } = await supabase
    .from("fan_event_attendees")
    .select("fan_event_id")
    .in("fan_event_id", ids)
    .eq("status", "going");

  if (attendeesError) {
    console.error("fetchAllPublicFanEvents attendees:", attendeesError);
  }

  const counts = new Map<number, number>();
  for (const row of (attendeeRows ?? []) as { fan_event_id: number }[]) {
    counts.set(row.fan_event_id, (counts.get(row.fan_event_id) ?? 0) + 1);
  }

  return rows.map((row) => mapRow(row, counts.get(row.id) ?? 0));
}

export async function setFanEventAttendance(
  fanEventId: number,
  status: "going" | "interested" | "declined"
): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return false;

  const { error } = await supabase
    .from("fan_event_attendees")
    .upsert(
      { fan_event_id: fanEventId, profile_id: userId, status },
      { onConflict: "fan_event_id,profile_id" }
    );

  if (error) {
    console.error("setFanEventAttendance:", error);
    return false;
  }
  return true;
}
