import { supabase } from "./supabaseClient";

export type AttendStatus = "going" | "interested" | "declined";

export interface FanEventImage {
  id: number;
  fanEventId: number;
  imageUrl: string;
  storagePath: string;
  sortOrder: number;
}

export interface EventOrganizerProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface FanEventAttendee {
  id: string;
  fanEventId: number | string;
  profileId: string;
  status: AttendStatus;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
}

export interface FanEventDetail {
  source: "db" | "seed";
  id: number;
  seedId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  mainImagePath: string | null;
  startAt: string;
  endAt: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  highlights: string[];
  tags: string[];
  capacity: number | null;
  isPublic: boolean;
  organizerProfileId: string;
  organizer: EventOrganizerProfile | null;
  organizerBio: string | null;
  images: FanEventImage[];
  attendees: FanEventAttendee[];
  goingCount: number;
}

export interface CreateFanEventInput {
  title: string;
  description: string;
  venue: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  startAt: string;
  endAt?: string | null;
  capacity?: number | null;
  isPublic?: boolean;
  hostBio?: string | null;
  tags?: string[];
  highlights?: string[];
  imageFiles: File[];
}

export interface UpdateFanEventInput {
  title?: string;
  description?: string;
  venue?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  startAt?: string;
  endAt?: string | null;
  capacity?: number | null;
  isPublic?: boolean;
  hostBio?: string | null;
  tags?: string[];
  highlights?: string[];
}

export const EVENT_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");
  return user.id;
}

function buildQueryError(scope: string, message: string) {
  return new Error(`${scope}: ${message}`);
}

export function validateEventImageFile(file: File): string | null {
  if (!EVENT_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof EVENT_IMAGE_ALLOWED_TYPES)[number])) {
    return "Image must be JPG, PNG, or WEBP.";
  }
  if (file.size > EVENT_IMAGE_MAX_BYTES) {
    return "Image must be under 5 MB.";
  }
  return null;
}

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  main_image_path: string | null;
  start_at: string;
  end_at: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  is_public: boolean;
  organizer_profile_id: string;
  host_bio: string | null;
  tags: string[] | null;
  highlights: string[] | null;
};

type AttendeeRow = {
  id: number;
  fan_event_id: number;
  profile_id: string;
  status: AttendStatus;
  created_at: string;
};

type ImageRow = {
  id: number;
  fan_event_id: number;
  image_url: string;
  storage_path: string;
  sort_order: number;
};

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

async function fetchProfileMap(
  profileIds: string[]
): Promise<Map<string, ProfileRow>> {
  if (profileIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", profileIds);
  if (error) {
    throw buildQueryError("profiles query failed", error.message);
  }
  return new Map((data ?? []).map((p) => [p.id, p as ProfileRow]));
}

function hydrateAttendees(
  rows: AttendeeRow[],
  profilesMap: Map<string, ProfileRow>
): FanEventAttendee[] {
  return rows.map((row) => {
    const profile = profilesMap.get(row.profile_id);
    return {
      id: String(row.id),
      fanEventId: row.fan_event_id,
      profileId: row.profile_id,
      status: row.status,
      createdAt: row.created_at,
      username: profile?.username ?? "Fan",
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}

export async function fetchFanEventDetail(
  eventId: number
): Promise<FanEventDetail | null> {
  const { data: event, error: eventError } = await supabase
    .from("fan_events")
    .select(
      "id, title, description, image_url, main_image_path, start_at, end_at, venue, address, city, state, country, country_code, lat, lng, capacity, is_public, organizer_profile_id, host_bio, tags, highlights"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw buildQueryError("fan_events query failed", eventError.message);
  }
  if (!event) return null;

  const eventRow = event as EventRow;

  const [imagesResult, attendeesResult, organizerResult] = await Promise.all([
    supabase
      .from("fan_event_images")
      .select("id, fan_event_id, image_url, storage_path, sort_order")
      .eq("fan_event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("fan_event_attendees")
      .select("id, fan_event_id, profile_id, status, created_at")
      .eq("fan_event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", eventRow.organizer_profile_id)
      .maybeSingle(),
  ]);

  if (imagesResult.error) {
    throw buildQueryError(
      "fan_event_images query failed",
      imagesResult.error.message
    );
  }
  if (attendeesResult.error) {
    throw buildQueryError(
      "fan_event_attendees query failed",
      attendeesResult.error.message
    );
  }
  if (organizerResult.error) {
    throw buildQueryError(
      "organizer profile query failed",
      organizerResult.error.message
    );
  }

  const attendeeRows = (attendeesResult.data ?? []) as AttendeeRow[];
  const profileIds = Array.from(
    new Set(attendeeRows.map((row) => row.profile_id))
  );
  const profilesMap = await fetchProfileMap(profileIds);
  const attendees = hydrateAttendees(attendeeRows, profilesMap);
  const goingCount = attendees.filter((a) => a.status === "going").length;

  const organizerRow = organizerResult.data as ProfileRow | null;
  const organizer: EventOrganizerProfile | null = organizerRow
    ? {
        id: organizerRow.id,
        username: organizerRow.username,
        avatarUrl: organizerRow.avatar_url ?? null,
      }
    : null;

  const images: FanEventImage[] = (
    (imagesResult.data ?? []) as ImageRow[]
  ).map((row) => ({
    id: row.id,
    fanEventId: row.fan_event_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
  }));

  return {
    source: "db",
    id: eventRow.id,
    seedId: null,
    title: eventRow.title,
    description: eventRow.description,
    imageUrl: eventRow.image_url,
    mainImagePath: eventRow.main_image_path,
    startAt: eventRow.start_at,
    endAt: eventRow.end_at,
    venue: eventRow.venue,
    address: eventRow.address,
    city: eventRow.city,
    state: eventRow.state,
    country: eventRow.country,
    countryCode: eventRow.country_code,
    lat: eventRow.lat,
    lng: eventRow.lng,
    category: null,
    highlights: eventRow.highlights ?? [],
    tags: eventRow.tags ?? [],
    capacity: eventRow.capacity,
    isPublic: eventRow.is_public,
    organizerProfileId: eventRow.organizer_profile_id,
    organizer,
    organizerBio: eventRow.host_bio,
    images,
    attendees,
    goingCount,
  };
}

export async function fetchFanEventAttendees(
  eventId: number
): Promise<FanEventAttendee[]> {
  const { data, error } = await supabase
    .from("fan_event_attendees")
    .select("id, fan_event_id, profile_id, status, created_at")
    .eq("fan_event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw buildQueryError(
      "fan_event_attendees query failed",
      error.message
    );
  }

  const rows = (data ?? []) as AttendeeRow[];
  const profileIds = Array.from(new Set(rows.map((row) => row.profile_id)));
  const profilesMap = await fetchProfileMap(profileIds);
  return hydrateAttendees(rows, profilesMap);
}

export async function uploadEventImage(
  eventId: number,
  file: File,
  sortOrder: number
): Promise<FanEventImage> {
  const userId = await getAuthenticatedUserId();
  const validationError = validateEventImageFile(file);
  if (validationError) throw new Error(validationError);

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const storagePath = `${userId}/${eventId}/${sortOrder}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("event-images")
    .upload(storagePath, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    throw buildQueryError("event-images upload failed", uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-images").getPublicUrl(storagePath);

  const { data: inserted, error: insertError } = await supabase
    .from("fan_event_images")
    .insert({
      fan_event_id: eventId,
      image_url: publicUrl,
      storage_path: storagePath,
      sort_order: sortOrder,
    })
    .select("id, fan_event_id, image_url, storage_path, sort_order")
    .single();

  if (insertError) {
    throw buildQueryError(
      "fan_event_images insert failed",
      insertError.message
    );
  }

  const row = inserted as ImageRow;
  return {
    id: row.id,
    fanEventId: row.fan_event_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
  };
}

export async function createFanEvent(
  input: CreateFanEventInput
): Promise<number> {
  const userId = await getAuthenticatedUserId();

  if (!input.title.trim()) throw new Error("Title is required.");
  if (!input.description.trim()) throw new Error("Description is required.");
  if (!input.venue.trim()) throw new Error("Location is required.");
  if (!input.startAt) throw new Error("Start date is required.");

  const startDate = new Date(input.startAt);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid start date.");
  }

  let endIso: string | null = null;
  if (input.endAt) {
    const endDate = new Date(input.endAt);
    if (Number.isNaN(endDate.getTime())) {
      throw new Error("Invalid end date.");
    }
    if (endDate.getTime() <= startDate.getTime()) {
      throw new Error("End date must be after start date.");
    }
    endIso = endDate.toISOString();
  }

  const imageFiles = input.imageFiles ?? [];
  if (imageFiles.length === 0) throw new Error("At least one photo is required.");

  for (const file of imageFiles) {
    const gValidation = validateEventImageFile(file);
    if (gValidation) throw new Error(gValidation);
  }

  const country = input.country?.trim() ? input.country.trim() : "US";
  const hostBio = input.hostBio?.trim() ? input.hostBio.trim() : null;
  const isPublic = input.isPublic ?? true;
  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  const highlights = (input.highlights ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const { data: inserted, error: insertError } = await supabase
    .from("fan_events")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      venue: input.venue.trim(),
      address: input.address?.trim() ? input.address.trim() : null,
      city: input.city?.trim() ? input.city.trim() : null,
      state: input.state?.trim() ? input.state.trim() : null,
      country,
      country_code: input.countryCode?.trim()
        ? input.countryCode.trim().toUpperCase()
        : null,
      lat: input.lat != null && Number.isFinite(input.lat) ? input.lat : null,
      lng: input.lng != null && Number.isFinite(input.lng) ? input.lng : null,
      start_at: startDate.toISOString(),
      end_at: endIso,
      capacity:
        input.capacity != null && Number.isFinite(input.capacity)
          ? input.capacity
          : null,
      organizer_profile_id: userId,
      is_public: isPublic,
      host_bio: hostBio,
      tags,
      highlights,
    })
    .select("id")
    .single();

  if (insertError) {
    throw buildQueryError("fan_events insert failed", insertError.message);
  }

  const eventId = (inserted as { id: number }).id;

  const cover = await uploadEventImage(eventId, imageFiles[0], 0);

  for (let i = 1; i < imageFiles.length; i++) {
    try {
      await uploadEventImage(eventId, imageFiles[i], i);
    } catch (err) {
      console.error("createFanEvent gallery upload failed:", err);
    }
  }

  const { error: updateError } = await supabase
    .from("fan_events")
    .update({
      image_url: cover.imageUrl,
      main_image_path: cover.storagePath,
    })
    .eq("id", eventId);

  if (updateError) {
    throw buildQueryError(
      "fan_events main image update failed",
      updateError.message
    );
  }

  return eventId;
}

export async function updateFanEvent(
  eventId: number,
  input: UpdateFanEventInput
): Promise<void> {
  await getAuthenticatedUserId();

  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) throw new Error("Title is required.");
    patch.title = trimmed;
  }
  if (input.description !== undefined) {
    const trimmed = input.description.trim();
    if (!trimmed) throw new Error("Description is required.");
    patch.description = trimmed;
  }
  if (input.venue !== undefined) {
    const trimmed = input.venue.trim();
    if (!trimmed) throw new Error("Location is required.");
    patch.venue = trimmed;
  }
  if (input.address !== undefined) {
    patch.address = input.address?.trim() ? input.address.trim() : null;
  }
  if (input.city !== undefined) {
    patch.city = input.city?.trim() ? input.city.trim() : null;
  }
  if (input.state !== undefined) {
    patch.state = input.state?.trim() ? input.state.trim() : null;
  }
  if (input.country !== undefined) {
    patch.country = input.country?.trim() ? input.country.trim() : "US";
  }
  if (input.countryCode !== undefined) {
    patch.country_code = input.countryCode?.trim()
      ? input.countryCode.trim().toUpperCase()
      : null;
  }
  if (input.lat !== undefined) {
    patch.lat =
      input.lat != null && Number.isFinite(input.lat) ? input.lat : null;
  }
  if (input.lng !== undefined) {
    patch.lng =
      input.lng != null && Number.isFinite(input.lng) ? input.lng : null;
  }
  if (input.startAt !== undefined) {
    if (!input.startAt) throw new Error("Start date is required.");
    const startDate = new Date(input.startAt);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Invalid start date.");
    }
    patch.start_at = startDate.toISOString();
  }
  if (input.endAt !== undefined) {
    if (!input.endAt) {
      patch.end_at = null;
    } else {
      const endDate = new Date(input.endAt);
      if (Number.isNaN(endDate.getTime())) {
        throw new Error("Invalid end date.");
      }
      patch.end_at = endDate.toISOString();
    }
  }
  if (input.capacity !== undefined) {
    patch.capacity =
      input.capacity != null && Number.isFinite(input.capacity)
        ? input.capacity
        : null;
  }
  if (input.isPublic !== undefined) {
    patch.is_public = input.isPublic;
  }
  if (input.hostBio !== undefined) {
    patch.host_bio = input.hostBio?.trim() ? input.hostBio.trim() : null;
  }
  if (input.tags !== undefined) {
    patch.tags = input.tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  if (input.highlights !== undefined) {
    patch.highlights = input.highlights
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("fan_events")
    .update(patch)
    .eq("id", eventId);

  if (error) {
    throw buildQueryError("fan_events update failed", error.message);
  }
}

export async function attendFanEvent(eventId: number): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("fan_event_attendees")
    .upsert(
      { fan_event_id: eventId, profile_id: userId, status: "going" },
      { onConflict: "fan_event_id,profile_id" }
    );
  if (error) {
    throw buildQueryError("fan_event_attendees upsert failed", error.message);
  }
}

export async function unattendFanEvent(eventId: number): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from("fan_event_attendees")
    .delete()
    .eq("fan_event_id", eventId)
    .eq("profile_id", userId)
    .select("id");

  if (error) {
    throw buildQueryError("fan_event_attendees delete failed", error.message);
  }
  if (!data || data.length === 0) {
    throw new Error(
      "Could not unattend. Your attendance record was not removed."
    );
  }
}

export function subscribeToFanEventAttendees(
  eventId: number,
  onChange: () => void
): () => void {
  const channel = supabase
    .channel(`fan-event-attendees-${eventId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "fan_event_attendees",
        filter: `fan_event_id=eq.${eventId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
