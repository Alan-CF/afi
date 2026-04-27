import { supabase } from "./supabaseClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export type FriendProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  name: string | null;
};

export type Friend = {
  friendshipId: string;
  profile: FriendProfile;
};

export type PendingInvite = {
  friendshipId: string;
  from: FriendProfile;
};

export type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted";

export type SearchResultProfile = FriendProfile & {
  friendshipStatus: FriendshipStatus;
};

export type PublicProfile = {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  fanatic_coins: number;
  streak: number;
  caption: string | null;
};

export type PublicFriend = {
  id: string;
  username: string;
  avatar_url: string | null;
  name: string | null;
};

// ─── Internal helper ─────────────────────────────────────────────────────────

async function getMyId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchProfilesByUsername(
  query: string
): Promise<SearchResultProfile[]> {
  if (!query.trim()) return [];

  const myId = await getMyId();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, name")
    .ilike("username", `%${query.trim()}%`)
    .neq("id", myId)
    .limit(20);

  if (profilesError) throw profilesError;
  if (!profiles || profiles.length === 0) return [];

  // Load existing relationships so we can show correct status on each result
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_profile_id, receiver_profile_id, status")
    .or(`requester_profile_id.eq.${myId},receiver_profile_id.eq.${myId}`)
    .in("status", ["pending", "accepted"]);

  const relMap = new Map<string, { status: string; iAmRequester: boolean }>();
  for (const f of friendships ?? []) {
    const otherId =
      f.requester_profile_id === myId
        ? f.receiver_profile_id
        : f.requester_profile_id;
    relMap.set(otherId, {
      status: f.status,
      iAmRequester: f.requester_profile_id === myId,
    });
  }

  return profiles.map((p) => {
    const rel = relMap.get(p.id);
    let friendshipStatus: FriendshipStatus = "none";
    if (rel) {
      if (rel.status === "accepted") friendshipStatus = "accepted";
      else if (rel.iAmRequester) friendshipStatus = "pending_sent";
      else friendshipStatus = "pending_received";
    }
    return {
      id: p.id,
      username: p.username,
      avatar_url: p.avatar_url ?? null,
      name: p.name ?? null,
      friendshipStatus,
    };
  });
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export async function fetchMyFriends(): Promise<Friend[]> {
  const myId = await getMyId();

  const { data: friendships, error: fsError } = await supabase
    .from("friendships")
    .select("id, requester_profile_id, receiver_profile_id")
    .eq("status", "accepted")
    .or(`requester_profile_id.eq.${myId},receiver_profile_id.eq.${myId}`);

  if (fsError) throw fsError;
  if (!friendships || friendships.length === 0) return [];

  const friendIds = friendships.map((f) =>
    f.requester_profile_id === myId
      ? f.receiver_profile_id
      : f.requester_profile_id
  );

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, name")
    .in("id", friendIds);

  if (pError) throw pError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return friendships
    .map((f) => {
      const friendId =
        f.requester_profile_id === myId
          ? f.receiver_profile_id
          : f.requester_profile_id;
      const profile = profileMap.get(friendId);
      if (!profile) return null;
      return {
        friendshipId: f.id,
        profile: {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url ?? null,
          name: profile.name ?? null,
        },
      };
    })
    .filter(Boolean) as Friend[];
}

export async function fetchMyFriendIds(): Promise<string[]> {
  const myId = await getMyId();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_profile_id, receiver_profile_id")
    .eq("status", "accepted")
    .or(`requester_profile_id.eq.${myId},receiver_profile_id.eq.${myId}`);

  return (friendships ?? []).map((f) =>
    f.requester_profile_id === myId
      ? f.receiver_profile_id
      : f.requester_profile_id
  );
}

export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw error;
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export async function sendFriendInvite(
  receiverProfileId: string
): Promise<void> {
  const myId = await getMyId();

  const { error } = await supabase.from("friendships").insert({
    requester_profile_id: myId,
    receiver_profile_id: receiverProfileId,
    status: "pending",
  });

  if (error) throw error;
}

export async function fetchPendingFriendInvites(): Promise<PendingInvite[]> {
  const myId = await getMyId();

  const { data: friendships, error: fsError } = await supabase
    .from("friendships")
    .select("id, requester_profile_id")
    .eq("receiver_profile_id", myId)
    .eq("status", "pending");

  if (fsError) throw fsError;
  if (!friendships || friendships.length === 0) return [];

  const requesterIds = friendships.map((f) => f.requester_profile_id);

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, name")
    .in("id", requesterIds);

  if (pError) throw pError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return friendships
    .map((f) => {
      const profile = profileMap.get(f.requester_profile_id);
      if (!profile) return null;
      return {
        friendshipId: f.id,
        from: {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url ?? null,
          name: profile.name ?? null,
        },
      };
    })
    .filter(Boolean) as PendingInvite[];
}

export async function acceptFriendInvite(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);

  if (error) throw error;
}

export async function declineFriendInvite(
  friendshipId: string
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "declined" })
    .eq("id", friendshipId);

  if (error) throw error;
}

// ─── Public profile ───────────────────────────────────────────────────────────

export async function fetchPendingFriendRequestCount(): Promise<number> {
  const myId = await getMyId();
  const { count, error } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("receiver_profile_id", myId)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

export async function fetchPublicProfileById(
  profileId: string
): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, avatar_url, fanatic_coins, streak, caption")
    .eq("id", profileId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    name: data.name ?? null,
    avatar_url: data.avatar_url ?? null,
    fanatic_coins: data.fanatic_coins ?? 0,
    streak: data.streak ?? 0,
    caption: data.caption ?? null,
  };
}

export async function fetchPublicFriendsByProfileId(
  profileId: string
): Promise<PublicFriend[]> {
  const { data: friendships, error: fsError } = await supabase
    .from("friendships")
    .select("requester_profile_id, receiver_profile_id")
    .eq("status", "accepted")
    .or(
      `requester_profile_id.eq.${profileId},receiver_profile_id.eq.${profileId}`
    );

  if (fsError || !friendships || friendships.length === 0) return [];

  const friendIds = friendships.map((f) =>
    f.requester_profile_id === profileId
      ? f.receiver_profile_id
      : f.requester_profile_id
  );

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, name")
    .in("id", friendIds);

  if (pError || !profiles) return [];

  return profiles.map((p) => ({
    id: p.id,
    username: p.username,
    avatar_url: p.avatar_url ?? null,
    name: p.name ?? null,
  }));
}
