import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  acceptRoomInvite,
  declineRoomInvite,
  fetchMyRoomInvites,
  fetchRoomInvite,
  type RoomInvite,
} from "../../hooks/useRooms";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

type Notification = RoomInvite & { key: string };

function Toast({
  invite,
  responding,
  onAccept,
  onDecline,
}: {
  invite: Notification;
  responding: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="w-72 overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(29,66,138,0.18)] ring-1 ring-slate-200">
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: invite.accent }}
        >
          <UserGroupIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-lato text-xs font-bold text-secondary">
            Group invite
          </p>
          <p className="truncate font-lato text-[13px] font-bold text-slate-800">
            {invite.title}
          </p>
          <p className="truncate font-lato text-[11px] text-slate-500">
            Invited by @{invite.invitedBy}
          </p>
        </div>
        <button
          onClick={onDecline}
          disabled={responding}
          aria-label="Decline"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {invite.nonFriendCount > 0 && (
        <div className="mx-3 mb-2 flex items-start gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5">
          <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
          <p className="font-lato text-[11px] font-semibold leading-snug text-secondary">
            This group has {invite.nonFriendCount}{" "}
            {invite.nonFriendCount === 1 ? "person" : "people"} who{" "}
            {invite.nonFriendCount === 1 ? "is" : "are"} not your friend.
          </p>
        </div>
      )}

      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={onDecline}
          disabled={responding}
          className="flex-1 rounded-lg bg-slate-100 py-1.5 font-lato text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          disabled={responding}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary py-1.5 font-lato text-xs font-bold text-white hover:bg-[#16327a] disabled:opacity-60"
        >
          <CheckIcon className="h-3.5 w-3.5" />
          Join
        </button>
      </div>
    </div>
  );
}

export default function RoomInviteProvider() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const seenRoomIds = useRef<Set<number>>(new Set());

  function pushInvite(invite: RoomInvite) {
    if (seenRoomIds.current.has(invite.roomId)) return;
    seenRoomIds.current.add(invite.roomId);
    setNotifications((prev) => [
      ...prev,
      { ...invite, key: invite.roomId + "-" + Date.now() },
    ]);
  }

  function removeRoom(roomId: number) {
    setNotifications((prev) => prev.filter((n) => n.roomId !== roomId));
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Existing pending invites on load.
      try {
        const invites = await fetchMyRoomInvites();
        if (!cancelled) invites.forEach(pushInvite);
      } catch (err) {
        console.error("Load room invites error:", err);
      }

      // Live invites.
      channel = supabase
        .channel("room-invites-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "room_members",
            filter: `profile_id=eq.${user.id}`,
          },
          async (payload) => {
            const row = payload.new as { room_id: number; status: string };
            if (row.status !== "pending") return;

            try {
              const invite = await fetchRoomInvite(row.room_id);
              if (invite && !cancelled) pushInvite(invite);
            } catch (err) {
              console.error("Fetch room invite error:", err);
            }
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function handleAccept(roomId: number) {
    try {
      setRespondingId(roomId);
      await acceptRoomInvite(roomId);
      window.dispatchEvent(new CustomEvent("room-invite-changed"));
    } catch (err) {
      console.error("Accept room invite error:", err);
    } finally {
      setRespondingId(null);
      removeRoom(roomId);
    }
  }

  async function handleDecline(roomId: number) {
    try {
      setRespondingId(roomId);
      await declineRoomInvite(roomId);
      window.dispatchEvent(new CustomEvent("room-invite-changed"));
    } catch (err) {
      console.error("Decline room invite error:", err);
    } finally {
      setRespondingId(null);
      removeRoom(roomId);
    }
  }

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {notifications.map((n) => (
        <Toast
          key={n.key}
          invite={n}
          responding={respondingId === n.roomId}
          onAccept={() => handleAccept(n.roomId)}
          onDecline={() => handleDecline(n.roomId)}
        />
      ))}
    </div>
  );
}
