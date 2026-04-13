import { supabase } from "../lib/supabaseClient";
import type { Room } from "../components/ui/RoomCard";
import type { PredictionOption } from "./mockRoomGameFeed";

export const ROOM_SYSTEM_MESSAGE_PREFIX = "[[system]] ";
export const ROOM_PREDICTION_MESSAGE_PREFIX = "[[prediction]] ";

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
  messages: RoomChatMessageRecord[];
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

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");

  return user.id;
}

async function fetchUsername(profileId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  if (error) {
    throw buildQueryError("profiles query failed", error.message);
  }

  return data.username as string;
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
    .select("id, title, status, accent")
    .eq("id", roomId)
    .single();

  if (roomError) {
    throw buildQueryError("rooms query failed", roomError.message);
  }

  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("profile_id")
    .eq("room_id", roomId);

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
    members: formatMembers(
      memberIds
        .map((memberId) => profileMap.get(memberId))
        .filter(Boolean) as string[]
    ),
    subtitle: "Live chat is on",
  };

  return {
    room: roomCard,
    currentUserId,
    messages: ((messages ?? []) as RoomMessageRow[]).map((message) => ({
      id: message.id,
      senderProfileId: message.sender_profile_id,
      senderName: profileMap.get(message.sender_profile_id) ?? "User",
      content: message.content,
      createdAt: message.created_at,
    })),
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

  try {
    const username = await fetchUsername(profileId);

    const { error: messageError } = await supabase.from("room_messages").insert({
      room_id: roomId,
      sender_profile_id: profileId,
      content: `${ROOM_SYSTEM_MESSAGE_PREFIX}${username} has left the chat.`,
    });

    if (messageError) {
      console.error("leave room system message error:", messageError);
    }
  } catch (error) {
    console.error("Could not create leave-room system message:", error);
  }

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
