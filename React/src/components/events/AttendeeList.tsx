import type { FanEventAttendee } from "../../lib/eventsApi";
import InitialsAvatar from "./InitialsAvatar";

interface Props {
  attendees: FanEventAttendee[];
  goingCount: number;
  currentUserId?: string | null;
}

function AttendeeAvatar({ attendee }: { attendee: FanEventAttendee }) {
  if (attendee.avatarUrl) {
    return (
      <img
        src={attendee.avatarUrl}
        alt={attendee.username}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        loading="lazy"
        onError={(event) => {
          (event.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return <InitialsAvatar username={attendee.username} size={40} />;
}

export default function AttendeeList({
  attendees,
  goingCount,
  currentUserId,
}: Props) {
  const going = attendees.filter((a) => a.status === "going");

  return (
    <section className="rounded-3xl border border-container-border bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-anton text-xl text-secondary">Going</h2>
        <span className="rounded-full bg-[#edf3ff] px-3 py-1 font-lato text-xs font-bold text-secondary tabular-nums">
          {goingCount}
        </span>
      </div>

      {going.length === 0 ? (
        <p className="mt-4 font-lato text-sm text-[#475569]">
          Be the first to attend.
        </p>
      ) : (
        <ul className="mt-4 flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1 sm:max-h-[460px]">
          {going.map((attendee) => {
            const isMe =
              currentUserId != null && attendee.profileId === currentUserId;
            return (
              <li
                key={attendee.id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
                  isMe ? "bg-[#fff8de]" : "bg-[#f9fbff]"
                }`}
              >
                <AttendeeAvatar attendee={attendee} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-lato text-sm font-bold text-[#304564]">
                    @{attendee.username}
                  </p>
                </div>
                {isMe && (
                  <span className="rounded-full bg-primary px-2 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.16em] text-secondary">
                    You
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
