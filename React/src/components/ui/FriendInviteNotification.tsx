import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { acceptFriendInvite, declineFriendInvite, type PendingInvite } from "../../lib/friends";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const ACCENTS = [
  "#8FB3E8", "#B8C9E8", "#9CB6E6", "#C8D6F2",
  "#A4BCE9", "#8CA8DB", "#B5C4E0", "#9FB3D8",
];

type Notification = PendingInvite & { key: string };

function Toast({
  notification,
  onAccept,
  onDecline,
}: {
  notification: Notification;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { from } = notification;
  const accentIndex = from.username.charCodeAt(0) % ACCENTS.length;

  return (
    <div className="flex w-72 items-start gap-3 rounded-[1.25rem] border border-[#cfd9ea] bg-white p-4 shadow-[0_8px_30px_rgba(29,66,138,0.18)]">
      {from.avatar_url ? (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <img
            src={from.avatar_url}
            alt={from.username}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-lato font-bold text-secondary"
          style={{ backgroundColor: ACCENTS[accentIndex] }}
        >
          {from.username[0]?.toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-lato text-sm font-bold text-[#1f3668]">
          Friend request
        </p>
        <p className="mt-0.5 truncate font-lato text-xs text-[#6b7a90]">
          <span className="font-semibold">@{from.username}</span> wants to be
          your friend
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onDecline}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff1f2] text-[#be123c] transition-colors hover:bg-[#fce7f3]"
            title="Decline"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onAccept}
            className="flex h-7 items-center gap-1 rounded-full bg-secondary px-3 font-lato text-xs font-bold text-white transition-colors hover:bg-[#16327a]"
          >
            <CheckIcon className="h-3 w-3" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FriendInviteProvider() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("friend-invites-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "friendships",
            filter: `receiver_profile_id=eq.${user.id}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: string;
              requester_profile_id: string;
            };

            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, avatar_url, name")
              .eq("id", row.requester_profile_id)
              .single();

            if (!profile) return;

            setNotifications((prev) => [
              ...prev,
              {
                key: row.id + "-" + Date.now(),
                friendshipId: row.id,
                from: {
                  id: profile.id,
                  username: profile.username,
                  avatar_url: profile.avatar_url ?? null,
                  name: profile.name ?? null,
                },
              },
            ]);
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function dismiss(key: string) {
    setNotifications((prev) => prev.filter((n) => n.key !== key));
  }

  async function handleAccept(n: Notification) {
    try {
      await acceptFriendInvite(n.friendshipId);
    } catch (err) {
      console.error("Accept invite error:", err);
    } finally {
      dismiss(n.key);
    }
  }

  async function handleDecline(n: Notification) {
    try {
      await declineFriendInvite(n.friendshipId);
    } catch (err) {
      console.error("Decline invite error:", err);
    } finally {
      dismiss(n.key);
    }
  }

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {notifications.map((n) => (
        <Toast
          key={n.key}
          notification={n}
          onAccept={() => handleAccept(n)}
          onDecline={() => handleDecline(n)}
        />
      ))}
    </div>
  );
}
