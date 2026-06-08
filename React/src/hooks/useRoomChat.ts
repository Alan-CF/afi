import { supabase } from "../lib/supabaseClient";
import type { Room } from "../components/ui/RoomCard";
import {
  ACTIVE_MOCK_MATCH_ID,
  type PredictionOption,
  type MockGameControl,
} from "./useMockRoomGameFeed";

export const ROOM_SYSTEM_MESSAGE_PREFIX = "[[system]] ";
export const ROOM_PREDICTION_MESSAGE_PREFIX = "[[prediction]] ";
// Visible, centered notice persisted in the chat (e.g. "Roberto changed the group photo").
export const ROOM_EVENT_MESSAGE_PREFIX = "[[event]] ";

export type RoomChatMessageRecord = {
  id: number;
  senderProfileId: string;
  senderName: string;
  content: string;
  createdAt: string;
};

export type RoomChatBootstrap = {
  room: Room;
  currentUserId: string;
  currentUsername: string;
  isOwner: boolean;
  messages: RoomChatMessageRecord[];
  mockControl: MockGameControl;
};

export type RoomPredictionEntryRecord = {
  id: number;
  senderProfileId: string;
  senderName: string;
  round: number;
  choice: PredictionOption;
  cycleStartMs: number;
  createdAt: string;
};

type RoomMemberRow = {
  profile_id: string;
  role: string;
};

type ProfileRow = {
  id: string;
  username: string;
};

type RoomMessageRow = {
  id: number;
  sender_profile_id: string;
  content: string;
  created_at: string;
};

type RoomMatchHiddenRow = {
  id: number;
  match_hidden: boolean;
};

type MockGameStateRow = {
  anchor_ms?: number | string | null;
};

function parseGlobalMockControl(row: MockGameStateRow | null): MockGameControl {
  // bigint columns can come back as number or string depending on the driver.
  const anchorRaw =
    !row || row.anchor_ms === null || row.anchor_ms === undefined
      ? null
      : Number(row.anchor_ms);
  const anchorMs =
    anchorRaw !== null && Number.isFinite(anchorRaw) ? anchorRaw : null;

  return { matchId: ACTIVE_MOCK_MATCH_ID, anchorMs, offsetSeconds: 0 };
}

type SerializedPredictionPayload = {
  round: number;
  choice: PredictionOption;
  cycleStartMs: number;
};

function buildQueryError(scope: string, message: string) {
  return new Error(`${scope}: ${message}`);
}

function formatMembers(usernames: string[]) {
  if (usernames.length <= 3) return usernames.join(", ");
  return `${usernames.slice(0, 3).join(", ")} +${usernames.length - 3}`;
}

export function isRoomSystemMessage(content: string) {
  return content.startsWith(ROOM_SYSTEM_MESSAGE_PREFIX);
}

export function isRoomPredictionMessage(content: string) {
  return content.startsWith(ROOM_PREDICTION_MESSAGE_PREFIX);
}

export function isRoomEventMessage(content: string) {
  return content.startsWith(ROOM_EVENT_MESSAGE_PREFIX);
}

export function shouldHideRoomMessage(content: string) {
  // Event messages stay visible (rendered as a centered notice).
  return isRoomSystemMessage(content) || isRoomPredictionMessage(content);
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");

  return user.id;
}

async function fetchProfileMap(profileIds: string[]) {
  if (profileIds.length === 0) return new Map<string, string>();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", profileIds);

  if (error) {
    throw buildQueryError("profiles query failed", error.message);
  }

  return new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile.username])
  );
}

export async function fetchRoomChat(roomId: number): Promise<RoomChatBootstrap> {
  const currentUserId = await getAuthenticatedUserId();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, title, status, accent, match_hidden, image_url, owner_profile_id")
    .eq("id", roomId)
    .single();

  if (roomError) {
    throw buildQueryError("rooms query failed", roomError.message);
  }

  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("profile_id, role")
    .eq("room_id", roomId)
    .eq("status", "accepted");

  if (membersError) {
    throw buildQueryError("room_members query failed", membersError.message);
  }

  const memberIds = Array.from(
    new Set(((members ?? []) as RoomMemberRow[]).map((member) => member.profile_id))
  );

  const profileMap = await fetchProfileMap(memberIds);

  const { data: messages, error: messagesError } = await supabase
    .from("room_messages")
    .select("id, sender_profile_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw buildQueryError("room_messages query failed", messagesError.message);
  }

  const roomCard: Room = {
    id: room.id,
    title: room.title,
    status: room.status,
    accent: room.accent,
    memberProfileIds: memberIds,
    members: formatMembers(
      memberIds
        .map((memberId) => profileMap.get(memberId))
        .filter(Boolean) as string[]
    ),
    subtitle: "Live chat is on",
    matchHidden: room.match_hidden ?? false,
    imageUrl: room.image_url ?? null,
  };

  return {
    room: roomCard,
    currentUserId,
    currentUsername: profileMap.get(currentUserId) ?? "Someone",
    isOwner:
      room.owner_profile_id === currentUserId ||
      ((members ?? []) as RoomMemberRow[]).some(
        (member) =>
          member.profile_id === currentUserId && member.role === "owner"
      ),
    messages: ((messages ?? []) as RoomMessageRow[]).map((message) => ({
      id: message.id,
      senderProfileId: message.sender_profile_id,
      senderName: profileMap.get(message.sender_profile_id) ?? "User",
      content: message.content,
      createdAt: message.created_at,
    })),
    mockControl: await fetchGlobalMockControl(),
  };
}

// The mock game is a single shared simulation for the whole app, stored in the
// mock_game_state singleton row.
export async function fetchGlobalMockControl(): Promise<MockGameControl> {
  const { data, error } = await supabase
    .from("mock_game_state")
    .select("anchor_ms")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw buildQueryError("mock_game_state query failed", error.message);
  }

  return parseGlobalMockControl((data ?? null) as MockGameStateRow | null);
}

// Owner-only (enforced by reset_global_mock_game, which checks room ownership).
// Restarts the shared mock match for everyone, on every device.
export async function resetGlobalMockGame(): Promise<void> {
  const { error } = await supabase.rpc("reset_global_mock_game", {
    p_anchor_ms: Date.now(),
  });

  if (error) {
    throw buildQueryError("reset global mock game failed", error.message);
  }
}

export function subscribeToGlobalMockControl(
  onChange: (control: MockGameControl) => void
) {
  const channel = supabase
    .channel("mock-game-state")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mock_game_state",
      },
      (payload) => {
        onChange(parseGlobalMockControl(payload.new as MockGameStateRow));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function fetchRoomMessages(
  roomId: number
): Promise<RoomChatMessageRecord[]> {
  const { data: messages, error: messagesError } = await supabase
    .from("room_messages")
    .select("id, sender_profile_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw buildQueryError("room_messages query failed", messagesError.message);
  }

  const senderIds = Array.from(
    new Set(
      ((messages ?? []) as RoomMessageRow[]).map(
        (message) => message.sender_profile_id
      )
    )
  );
  const profileMap = await fetchProfileMap(senderIds);

  return ((messages ?? []) as RoomMessageRow[]).map((message) => ({
    id: message.id,
    senderProfileId: message.sender_profile_id,
    senderName: profileMap.get(message.sender_profile_id) ?? "User",
    content: message.content,
    createdAt: message.created_at,
  }));
}

export async function sendRoomMessage(
  roomId: number,
  content: string
): Promise<RoomChatMessageRecord> {
  const senderProfileId = await getAuthenticatedUserId();
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("room_messages")
    .insert({
      room_id: roomId,
      sender_profile_id: senderProfileId,
      content: trimmedContent,
    })
    .select("id, sender_profile_id, content, created_at")
    .single();

  if (error) {
    throw buildQueryError("room_messages insert failed", error.message);
  }

  const message = data as RoomMessageRow;

  return {
    id: message.id,
    senderProfileId: message.sender_profile_id,
    senderName: "You",
    content: message.content,
    createdAt: message.created_at,
  };
}

// Sends a centered, persistent notice to the chat (visible to everyone).
export async function sendRoomEventMessage(
  roomId: number,
  text: string
): Promise<RoomChatMessageRecord> {
  return sendRoomMessage(roomId, `${ROOM_EVENT_MESSAGE_PREFIX}${text}`);
}

const ROOM_AVATAR_BUCKET = "room-avatars";

// Uploads a room photo to storage and returns its public URL.
export async function uploadRoomImage(
  roomId: number,
  file: File
): Promise<string> {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Only JPG and PNG images are allowed.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be under 2MB.");
  }

  const fileExt = file.name.split(".").pop() ?? "jpg";
  const filePath = `${roomId}/photo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(ROOM_AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw buildQueryError("room image upload failed", uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(ROOM_AVATAR_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

// Updates the room's shared photo. Any accepted member is allowed (RLS).
export async function updateRoomImage(
  roomId: number,
  imageUrl: string
): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ image_url: imageUrl })
    .eq("id", roomId);

  if (error) {
    throw buildQueryError("room image update failed", error.message);
  }
}

function serializePredictionPayload(payload: SerializedPredictionPayload) {
  return `${ROOM_PREDICTION_MESSAGE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseRoomPredictionEntry(
  message: RoomChatMessageRecord
): RoomPredictionEntryRecord | null {
  if (!message.content.startsWith(ROOM_PREDICTION_MESSAGE_PREFIX)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      message.content.slice(ROOM_PREDICTION_MESSAGE_PREFIX.length)
    ) as SerializedPredictionPayload;

    if (
      typeof payload.round !== "number" ||
      typeof payload.choice !== "string" ||
      typeof payload.cycleStartMs !== "number"
    ) {
      return null;
    }

    return {
      id: message.id,
      senderProfileId: message.senderProfileId,
      senderName: message.senderName,
      round: payload.round,
      choice: payload.choice,
      cycleStartMs: payload.cycleStartMs,
      createdAt: message.createdAt,
    };
  } catch {
    return null;
  }
}

export async function sendRoomPrediction(
  roomId: number,
  round: number,
  choice: PredictionOption,
  cycleStartMs: number
): Promise<RoomPredictionEntryRecord> {
  const senderProfileId = await getAuthenticatedUserId();
  const payload = serializePredictionPayload({
    round,
    choice,
    cycleStartMs,
  });

  const { data, error } = await supabase
    .from("room_messages")
    .insert({
      room_id: roomId,
      sender_profile_id: senderProfileId,
      content: payload,
    })
    .select("id, sender_profile_id, content, created_at")
    .single();

  if (error) {
    throw buildQueryError("room_messages insert failed", error.message);
  }

  const insertedMessage: RoomChatMessageRecord = {
    id: data.id,
    senderProfileId: data.sender_profile_id,
    senderName: "You",
    content: data.content,
    createdAt: data.created_at,
  };

  const predictionEntry = parseRoomPredictionEntry(insertedMessage);
  if (!predictionEntry) {
    throw new Error("Could not parse prediction entry.");
  }

  return predictionEntry;
}

export async function leaveRoom(roomId: number): Promise<void> {
  const profileId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("profile_id", profileId)
    .select("id");

  if (error) {
    throw buildQueryError("room_members delete failed", error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Could not leave room. Your membership was not removed. Check the room_members delete policy."
    );
  }
}

export async function fetchRoomMatchHidden(roomId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("rooms")
    .select("match_hidden")
    .eq("id", roomId)
    .single();

  if (error) {
    throw buildQueryError("room match_hidden query failed", error.message);
  }

  return data?.match_hidden ?? false;
}

// Owner-only (enforced by the "rooms_update" RLS policy).
export async function setRoomMatchHidden(
  roomId: number,
  hidden: boolean
): Promise<void> {
  const { data, error } = await supabase
    .from("rooms")
    .update({ match_hidden: hidden })
    .eq("id", roomId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw buildQueryError("room match_hidden update failed", error.message);
  }

  if (!data) {
    throw new Error("Room match setting was not updated. Only the room owner can change it.");
  }
}

export async function removeRoomMatch(roomId: number): Promise<void> {
  const { error } = await supabase.rpc("remove_room_match", {
    target_room_id: roomId,
  });

  if (error) {
    throw buildQueryError("remove room match failed", error.message);
  }
}

export function subscribeToRoomMessages(
  roomId: number,
  onMessage: (message: RoomChatMessageRecord) => void
) {
  const channel = supabase
    .channel(`room-messages-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_messages",
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        const insertedMessage = payload.new as RoomMessageRow;
        const profileMap = await fetchProfileMap([insertedMessage.sender_profile_id]);

        onMessage({
          id: insertedMessage.id,
          senderProfileId: insertedMessage.sender_profile_id,
          senderName:
            profileMap.get(insertedMessage.sender_profile_id) ?? "User",
          content: insertedMessage.content,
          createdAt: insertedMessage.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToRoomMatchHidden(
  roomId: number,
  onChange: (hidden: boolean) => void
) {
  const channel = supabase
    .channel(`room-match-hidden-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const updatedRoom = payload.new as RoomMatchHiddenRow;
        onChange(updatedRoom.match_hidden ?? false);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export type RoomMessageBroadcast = RoomChatMessageRecord & { roomId: number };

// Subscribes to new messages across every room the user belongs to. RLS makes
// realtime only deliver rows from rooms where the user is an accepted member,
// so no client-side room filtering is required.
export function subscribeToAllRoomMessages(
  onMessage: (message: RoomMessageBroadcast) => void
) {
  const channel = supabase
    .channel("room-messages-all")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_messages",
      },
      async (payload) => {
        const inserted = payload.new as RoomMessageRow & { room_id: number };
        const profileMap = await fetchProfileMap([inserted.sender_profile_id]);

        onMessage({
          id: inserted.id,
          roomId: inserted.room_id,
          senderProfileId: inserted.sender_profile_id,
          senderName: profileMap.get(inserted.sender_profile_id) ?? "User",
          content: inserted.content,
          createdAt: inserted.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
