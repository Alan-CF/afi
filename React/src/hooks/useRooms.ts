import { supabase } from "../lib/supabaseClient";
import { fetchMyFriendIds } from "../lib/friends";
import { shouldHideRoomMessage } from "./useRoomChat";

export type RoomCardData = {
  id: number;
  title: string;
  status: "live" | "offline";
  members: string;
  subtitle: string;
  accent: string;
  memberProfileIds: string[];
  lastMessageAt: string | null;
  lastMessageFromMe: boolean;
};

export type FriendOption = {
  id: string;
  name: string;
  accent: string;
  avatar_url: string | null;
  selected_frame_id: string | null;
};

export type RoomInvite = {
  roomId: number;
  title: string;
  accent: string;
  invitedBy: string;
  memberCount: number;
  nonFriendCount: number;
};

function formatMembers(usernames: string[]) {
  if (usernames.length <= 3) return usernames.join(", ");
  return `${usernames.slice(0, 3).join(", ")} +${usernames.length - 3}`;
}

function buildQueryError(scope: string, message: string) {
  return new Error(`${scope}: ${message}`);
}

const friendAccents = [
  "#8FB3E8",
  "#B8C9E8",
  "#9CB6E6",
  "#C8D6F2",
  "#A4BCE9",
  "#8CA8DB",
  "#B5C4E0",
  "#9FB3D8",
];

const roomAccents = ["#1D4ED8", "#2563EB", "#0F766E", "#7C3AED", "#C2410C"];

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");

  return user.id;
}

export async function fetchMyFriends(): Promise<FriendOption[]> {
  const userId = await getAuthenticatedUserId();

  const { data: friendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("requester_profile_id, receiver_profile_id")
    .eq("status", "accepted")
    .or(`requester_profile_id.eq.${userId},receiver_profile_id.eq.${userId}`);

  if (friendshipsError) {
    console.error("friendships error:", friendshipsError);
    throw buildQueryError("friendships query failed", friendshipsError.message);
  }

  const friendIds = Array.from(
    new Set(
      (friendships ?? []).map((friendship) =>
        friendship.requester_profile_id === userId
          ? friendship.receiver_profile_id
          : friendship.requester_profile_id
      )
    )
  );

  if (friendIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, selected_frame_id")
    .in("id", friendIds)
    .order("username", { ascending: true });

  if (profilesError) {
    console.error("friend profiles error:", profilesError);
    throw buildQueryError("friend profiles query failed", profilesError.message);
  }

  return (profiles ?? []).map((profile, index) => ({
    id: profile.id,
    name: profile.username,
    accent: friendAccents[index % friendAccents.length],
    avatar_url: profile.avatar_url ?? null,
    selected_frame_id: profile.selected_frame_id ?? null,
  }));
}

export async function createRoomWithMembers(
  title: string,
  memberIds: string[]
): Promise<number> {
  const ownerProfileId = await getAuthenticatedUserId();
  const uniqueMemberIds = Array.from(new Set(memberIds)).filter(Boolean);

  if (!title.trim()) {
    throw new Error("Room name is required.");
  }

  if (uniqueMemberIds.length === 0) {
    throw new Error("Select at least one friend.");
  }

  const accent =
    roomAccents[(title.trim().length + uniqueMemberIds.length) % roomAccents.length];

  const { data: createdRoom, error: roomInsertError } = await supabase
    .from("rooms")
    .insert({
      title: title.trim(),
      owner_profile_id: ownerProfileId,
      status: "live",
      accent,
    })
    .select("id")
    .single();

  if (roomInsertError) {
    console.error("create room error:", roomInsertError);
    throw buildQueryError("rooms insert failed", roomInsertError.message);
  }

  const roomId = createdRoom.id;
  const memberRows = [
    {
      room_id: roomId,
      profile_id: ownerProfileId,
      role: "owner",
      status: "accepted",
    },
    ...uniqueMemberIds.map((profileId) => ({
      room_id: roomId,
      profile_id: profileId,
      role: "member" as const,
      status: "pending" as const,
    })),
  ];

  const { error: memberInsertError } = await supabase
    .from("room_members")
    .insert(memberRows);

  if (memberInsertError) {
    console.error("create room members error:", memberInsertError);
    throw buildQueryError(
      "room_members insert failed",
      memberInsertError.message
    );
  }

  return roomId;
}

export async function fetchMyRooms(): Promise<RoomCardData[]> {
  const userId = await getAuthenticatedUserId();

  const { data: myMemberships, error: membershipsError } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("profile_id", userId)
    .eq("status", "accepted");

  if (membershipsError) {
    console.error("room_members error:", membershipsError);
    throw buildQueryError("room_members query failed", membershipsError.message);
  }

  const roomIds = (myMemberships ?? []).map((item) => item.room_id);

  if (roomIds.length === 0) return [];

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, title, status, accent")
    .in("id", roomIds);

  if (roomsError) {
    console.error("rooms error:", roomsError);
    throw buildQueryError("rooms query failed", roomsError.message);
  }

  const { data: allMembers, error: allMembersError } = await supabase
    .from("room_members")
    .select("room_id, profile_id")
    .in("room_id", roomIds)
    .eq("status", "accepted");

  if (allMembersError) {
    console.error("allMembers error:", allMembersError);
    throw buildQueryError(
      "room_members members query failed",
      allMembersError.message
    );
  }

  const memberIds = Array.from(
    new Set((allMembers ?? []).map((item) => item.profile_id))
  );

  const { data: profiles, error: profilesError } =
    memberIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("profiles")
          .select("id, username")
          .in("id", memberIds);

  if (profilesError) {
    console.error("profiles error:", profilesError);
    throw buildQueryError("profiles query failed", profilesError.message);
  }

  const { data: messages, error: messagesError } = await supabase
    .from("room_messages")
    .select("room_id, sender_profile_id, content, created_at")
    .in("room_id", roomIds)
    .order("created_at", { ascending: false });

  if (messagesError) {
    console.error("messages error:", messagesError);
    throw buildQueryError("room_messages query failed", messagesError.message);
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.username])
  );

  return (rooms ?? []).map((room) => {
    const roomMemberRows = (allMembers ?? []).filter(
      (member) => member.room_id === room.id
    );

    const membersForRoom = roomMemberRows
      .map((member) => profileMap.get(member.profile_id))
      .filter(Boolean) as string[];

    const memberProfileIds = roomMemberRows.map((member) => member.profile_id);

    const lastMessage = (messages ?? []).find(
      (message) =>
        message.room_id === room.id && !shouldHideRoomMessage(message.content)
    );

    const subtitle = lastMessage
      ? `${profileMap.get(lastMessage.sender_profile_id) ?? "User"}: ${lastMessage.content}`
      : "No messages yet";

    return {
      id: room.id,
      title: room.title,
      status: room.status,
      accent: room.accent,
      members: formatMembers(membersForRoom),
      subtitle,
      memberProfileIds,
      lastMessageAt: lastMessage ? lastMessage.created_at : null,
      lastMessageFromMe: lastMessage
        ? lastMessage.sender_profile_id === userId
        : false,
    };
  });
}

async function buildInvitesForRoomIds(
  roomIds: number[],
  userId: string
): Promise<RoomInvite[]> {
  if (roomIds.length === 0) return [];

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, title, accent, owner_profile_id")
    .in("id", roomIds);

  if (roomsError) {
    console.error("invite rooms error:", roomsError);
    throw buildQueryError("invite rooms query failed", roomsError.message);
  }

  const ownerIds = Array.from(
    new Set((rooms ?? []).map((room) => room.owner_profile_id))
  );

  const { data: owners, error: ownersError } =
    ownerIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("profiles")
          .select("id, username")
          .in("id", ownerIds);

  if (ownersError) {
    console.error("invite owners error:", ownersError);
    throw buildQueryError("invite owners query failed", ownersError.message);
  }

  const ownerMap = new Map(
    (owners ?? []).map((owner) => [owner.id, owner.username])
  );

  // All members of the invited rooms, to flag non-friends.
  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("room_id, profile_id")
    .in("room_id", roomIds);

  if (membersError) {
    console.error("invite members error:", membersError);
    throw buildQueryError("invite members query failed", membersError.message);
  }

  const friendIds = new Set(await fetchMyFriendIds());

  return (rooms ?? []).map((room) => {
    const roomMembers = (members ?? []).filter(
      (member) => member.room_id === room.id
    );
    const otherMembers = roomMembers.filter(
      (member) => member.profile_id !== userId
    );
    const nonFriendCount = otherMembers.filter(
      (member) => !friendIds.has(member.profile_id)
    ).length;

    return {
      roomId: room.id,
      title: room.title,
      accent: room.accent,
      invitedBy: ownerMap.get(room.owner_profile_id) ?? "Someone",
      memberCount: otherMembers.length,
      nonFriendCount,
    };
  });
}

export async function fetchMyRoomInvites(): Promise<RoomInvite[]> {
  const userId = await getAuthenticatedUserId();

  const { data: pendingMemberships, error: pendingError } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("profile_id", userId)
    .eq("status", "pending");

  if (pendingError) {
    console.error("pending room_members error:", pendingError);
    throw buildQueryError("room invites query failed", pendingError.message);
  }

  const roomIds = Array.from(
    new Set((pendingMemberships ?? []).map((item) => item.room_id))
  );

  return buildInvitesForRoomIds(roomIds, userId);
}

export async function fetchRoomInvite(
  roomId: number
): Promise<RoomInvite | null> {
  const userId = await getAuthenticatedUserId();

  const { data: membership, error: membershipError } = await supabase
    .from("room_members")
    .select("room_id, status")
    .eq("profile_id", userId)
    .eq("room_id", roomId)
    .eq("status", "pending")
    .maybeSingle();

  if (membershipError) {
    console.error("room invite lookup error:", membershipError);
    return null;
  }

  if (!membership) return null;

  const invites = await buildInvitesForRoomIds([roomId], userId);
  return invites[0] ?? null;
}

export async function acceptRoomInvite(roomId: number): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("room_members")
    .update({ status: "accepted" })
    .eq("room_id", roomId)
    .eq("profile_id", userId);

  if (error) {
    console.error("accept room invite error:", error);
    throw buildQueryError("accept room invite failed", error.message);
  }
}

export async function declineRoomInvite(roomId: number): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("profile_id", userId);

  if (error) {
    console.error("decline room invite error:", error);
    throw buildQueryError("decline room invite failed", error.message);
  }
}
