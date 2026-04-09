import { supabase } from "../lib/supabaseClient";

export type RoomCardData = {
  id: number;
  title: string;
  status: "live" | "offline";
  members: string;
  subtitle: string;
  accent: string;
};

export type FriendOption = {
  id: string;
  name: string;
  accent: string;
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
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (friendshipsError) {
    console.error("friendships error:", friendshipsError);
    throw buildQueryError("friendships query failed", friendshipsError.message);
  }

  const friendIds = Array.from(
    new Set(
      (friendships ?? []).map((friendship) =>
        friendship.requester_id === userId
          ? friendship.addressee_id
          : friendship.requester_id
      )
    )
  );

  if (friendIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
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
    { room_id: roomId, profile_id: ownerProfileId, role: "owner" },
    ...uniqueMemberIds.map((profileId) => ({
      room_id: roomId,
      profile_id: profileId,
      role: "member" as const,
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

  console.log("Authenticated user:", userId);

  const { data: myMemberships, error: membershipsError } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("profile_id", userId);

  if (membershipsError) {
    console.error("room_members error:", membershipsError);
    throw buildQueryError("room_members query failed", membershipsError.message);
  }

  const roomIds = (myMemberships ?? []).map((item) => item.room_id);

  console.log("My room ids:", roomIds);

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
    .in("room_id", roomIds);

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
    const membersForRoom = (allMembers ?? [])
      .filter((member) => member.room_id === room.id)
      .map((member) => profileMap.get(member.profile_id))
      .filter(Boolean) as string[];

    const lastMessage = (messages ?? []).find(
      (message) => message.room_id === room.id
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
    };
  });
}
