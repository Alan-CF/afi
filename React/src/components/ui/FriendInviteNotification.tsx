import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { acceptFriendInvite, declineFriendInvite, type PendingInvite } from "../../lib/friends";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const ACCENTS = [
  "#8FB3E8", "#B8C9E8", "#9CB6E6", "#C8D6F2",
  "#A4BCE9", "#8CA8DB", "#B5C4E0", "#9FB3D8",
];

const DISMISS_MS = 10_000;

type Notification = PendingInvite & { key: string };

function Toast({
  notification,
  onAccept,
  onDecline,
  onExpire,
}: {
  notification: Notification;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
}) {
  const { from } = notification;
  const accentIndex = from.username.charCodeAt(0) % ACCENTS.length;
  const [barStarted, setBarStarted] = useState(false);

  useEffect(() => {
    // rAF so the transition fires after first paint
    const frame = requestAnimationFrame(() => setBarStarted(true));
    const timer = setTimeout(onExpire, DISMISS_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-60 overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(29,66,138,0.16)] ring-1 ring-[#dde6f5]">
      {/* Content row */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2.5">
        {/* Avatar */}
        {from.avatar_url ? (
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <img src={from.avatar_url} alt={from.username} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-lato text-sm font-bold text-secondary"
            style={{ backgroundColor: ACCENTS[accentIndex] }}
          >
            {from.username[0]?.toUpperCase()}
          </div>
        )}

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="font-lato text-xs font-bold text-[#1f3668]">Friend request</p>
          <p className="truncate font-lato text-[11px] text-[#6b7a90]">
            <span className="font-semibold text-secondary">@{from.username}</span>
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDecline}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Accept button */}
      <div className="px-3 pb-3">
        <button
          onClick={onAccept}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-secondary py-1.5 font-lato text-xs font-bold text-white hover:bg-[#16327a]"
        >
          <CheckIcon className="h-3 w-3" />
          Accept
        </button>
      </div>

      {/* Timer bar */}
      <div className="h-0.5 w-full bg-[#e8eef8]">
        <div
          className="h-full bg-secondary"
          style={{
            width: barStarted ? "0%" : "100%",
            transition: barStarted ? `width ${DISMISS_MS}ms linear` : "none",
          }}
        />
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
      window.dispatchEvent(new CustomEvent("friend-accepted"));
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
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {notifications.map((n) => (
        <Toast
          key={n.key}
          notification={n}
          onAccept={() => handleAccept(n)}
          onDecline={() => handleDecline(n)}
          onExpire={() => dismiss(n.key)}
        />
      ))}
    </div>
  );
}
