import { supabase } from "../lib/supabaseClient";
import type { Room } from "../components/ui/RoomCard";

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
