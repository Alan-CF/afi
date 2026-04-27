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
  };
}

export async function fetchUpcomingFanEvents(limit = 10): Promise<FanEvent[]> {
  const { data, error } = await supabase
    .from("fan_events")
    .select("id, title, description, image_url, start_at, end_at, venue, city, country, capacity")
    .eq("is_public", true)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("fetchUpcomingFanEvents:", error);
    return [];
  }

  return (data as RawRow[]).map((row) => mapRow(row));
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
