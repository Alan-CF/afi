import { useMemo } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  EyeSlashIcon,
  LockClosedIcon,
  MapPinIcon,
  PencilSquareIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { Link, useNavigate, useParams } from "react-router-dom";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import EventFallbackVisual from "../components/home/EventFallbackVisual";
import AttendButton from "../components/events/AttendButton";
import AttendeeList from "../components/events/AttendeeList";
import InviteFriendsButton from "../components/events/InviteFriendsButton";
import EventGallery from "../components/events/EventGallery";
import EventMapPreview from "../components/events/EventMapPreview";
import InitialsAvatar from "../components/events/InitialsAvatar";
import { useEventDetail } from "../hooks/useEventDetail";
import { useSeedAttendance } from "../hooks/useSeedAttendance";
import { useProfile } from "../hooks/useProfile";
import {
  attendFanEvent,
  unattendFanEvent,
  type FanEventAttendee,
  type FanEventDetail,
} from "../lib/eventsApi";

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeRange(startIso: string, endIso: string | null) {
  const start = new Date(startIso);
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endIso) return startTime;
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const endLabel = sameDay
    ? end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : end.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  return `${startTime} → ${endLabel}`;
}

function formatDurationLabel(startIso: string, endIso: string | null) {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.round(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function buildLocationLines(event: FanEventDetail): string[] {
  const lines = [
    event.venue,
    event.address,
    [event.city, event.state].filter(Boolean).join(", "),
    event.country,
  ];
  return lines.filter((line): line is string => !!line && line.length > 0);
}

function buildMapQuery(event: FanEventDetail): string {
  return [event.venue, event.address, event.city, event.state, event.country]
    .filter(Boolean)
    .join(", ");
}

export default function EventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const rawId = eventId ?? null;

  const {
    event,
    loading,
    error,
    currentUserId,
    isAttending: isAttendingDb,
    refreshAttendees,
  } = useEventDetail(rawId);
  const { user: profile } = useProfile();
  const seedAttendance = useSeedAttendance(event?.seedId ?? null);

  const isOrganizer =
    !!event &&
    event.source === "db" &&
    !!currentUserId &&
    currentUserId === event.organizerProfileId;

  const eventPath = event
    ? `/events/${event.source === "seed" ? event.seedId : event.id}`
    : `/events`;

  const isAttending =
    !!event &&
    (event.source === "seed" ? seedAttendance.isAttending : isAttendingDb);

  const displayedAttendees: FanEventAttendee[] = useMemo(() => {
    if (!event) return [];
    if (
      event.source === "seed" &&
      seedAttendance.isAttending &&
      profile &&
      !event.attendees.some((a) => a.profileId === profile.id)
    ) {
      const me: FanEventAttendee = {
        id: `me-${profile.id}`,
        fanEventId: event.seedId ?? "",
        profileId: profile.id,
        status: "going",
        createdAt: new Date().toISOString(),
        username: profile.username,
        avatarUrl: profile.avatar_url || null,
      };
      return [me, ...event.attendees];
    }
    return event.attendees;
  }, [event, seedAttendance.isAttending, profile]);

  const displayedGoingCount = useMemo(() => {
    if (!event) return 0;
    if (event.source !== "seed") return event.goingCount;
    const baseGoing = event.attendees.filter((a) => a.status === "going").length;
    const alreadyIn =
      profile &&
      event.attendees.some((a) => a.profileId === profile.id);
    if (seedAttendance.isAttending && profile && !alreadyIn) {
      return baseGoing + 1;
    }
    return baseGoing;
  }, [event, seedAttendance.isAttending, profile]);

  async function handleToggleAttendance() {
    if (!event) return;
    if (event.source === "seed") {
      await seedAttendance.toggle();
      return;
    }
    if (isAttendingDb) {
      await unattendFanEvent(event.id);
    } else {
      await attendFanEvent(event.id);
    }
    await refreshAttendees();
  }

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 font-lato text-xs font-bold text-secondary shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition-colors hover:bg-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to events
          </button>

          {isOrganizer && event && (
            <Link
              to={`/events/${event.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 font-lato text-xs font-bold text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition-colors hover:bg-[#172b5b]"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Edit event
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="aspect-[16/9] rounded-3xl skeleton-shimmer" />
              <div className="h-8 w-2/3 rounded-2xl skeleton-shimmer" />
              <div className="h-4 w-full rounded-2xl skeleton-shimmer" />
              <div className="h-4 w-5/6 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="h-64 rounded-3xl skeleton-shimmer" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-container-border bg-white p-8 text-center">
            <p className="font-lato text-base text-text">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/events")}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary"
            >
              Back to events
            </button>
          </div>
        )}

        {!loading && !error && event && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="flex flex-col gap-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-secondary md:aspect-[16/9]">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <EventFallbackVisual />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                {!event.isPublic && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-secondary shadow-sm">
                    <LockClosedIcon className="h-3 w-3" />
                    Private
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-7 text-white">
                  {event.tags[0] && (
                    <span className="inline-flex rounded-full bg-primary px-3 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-secondary">
                      {event.tags[0]}
                    </span>
                  )}
                  <h1 className="mt-3 font-anton text-2xl sm:text-3xl md:text-4xl leading-tight">
                    {event.title}
                  </h1>
                  {(event.city || event.state) && (
                    <p className="mt-1 font-lato text-sm font-bold text-white/95">
                      {[event.city, event.state, event.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <section className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div className="flex flex-col gap-3 rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <CalendarDaysIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                        When
                      </p>
                      <p className="mt-0.5 font-anton text-base text-secondary leading-tight sm:text-lg">
                        {formatDayLabel(event.startAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-[#f6f8fc] p-3">
                    <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <div className="min-w-0">
                      <p className="font-lato text-sm font-bold text-secondary">
                        {formatTimeRange(event.startAt, event.endAt)}
                      </p>
                      {formatDurationLabel(event.startAt, event.endAt) && (
                        <p className="mt-0.5 font-lato text-xs font-bold text-[#475569]">
                          {formatDurationLabel(event.startAt, event.endAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8fc] p-3">
                    <UsersIcon className="h-4 w-4 shrink-0 text-secondary" />
                    <p className="font-lato text-sm font-bold text-secondary tabular-nums">
                      {displayedGoingCount}
                      {event.capacity ? ` / ${event.capacity}` : ""} going
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <MapPinIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                        Where
                      </p>
                      <p className="mt-0.5 font-anton text-base text-secondary leading-tight sm:text-lg">
                        {event.venue ?? "Location TBA"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {buildLocationLines(event).slice(1).map((line) => (
                      <p
                        key={line}
                        className="font-lato text-xs font-bold text-[#475569] [overflow-wrap:anywhere]"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                  <EventMapPreview
                    lat={event.lat}
                    lng={event.lng}
                    query={
                      event.lat == null || event.lng == null
                        ? buildMapQuery(event)
                        : null
                    }
                    label={event.venue}
                    height="h-36 md:h-44"
                    rounded="rounded-2xl"
                  />
                </div>
              </section>

              {(event.description || event.highlights.length > 0) && (
                <section className="rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5">
                  <h2 className="font-anton text-lg text-secondary sm:text-xl">About</h2>
                  {event.description && (
                    <p className="mt-3 whitespace-pre-wrap font-lato text-sm leading-6 text-[#1f3668]">
                      {event.description}
                    </p>
                  )}
                  {event.highlights.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-2">
                      {event.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-start gap-2 font-lato text-sm"
                        >
                          <CheckBadgeIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-[#1f3668]">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {event.organizer && (
                <section className="flex items-center gap-3 rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5">
                  {event.organizer.avatarUrl ? (
                    <img
                      src={event.organizer.avatarUrl}
                      alt={event.organizer.username}
                      className="h-12 w-12 rounded-2xl object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <InitialsAvatar
                      username={event.organizer.username}
                      size={48}
                      rounded="rounded-2xl"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#475569]">
                      Hosted by
                    </p>
                    <p className="mt-0.5 font-lato text-base font-bold text-secondary">
                      @{event.organizer.username}
                    </p>
                  </div>
                </section>
              )}

              <EventGallery
                images={event.images.map((image) => image.imageUrl)}
                alt={event.title}
              />
            </article>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
              <div className="order-2 flex flex-col gap-3 rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5 lg:order-1">
                <AttendButton
                  isLoggedIn={!!currentUserId}
                  isAttending={isAttending}
                  onToggle={handleToggleAttendance}
                />
                <InviteFriendsButton eventPath={eventPath} />
                {!event.isPublic && (
                  <div className="flex items-start gap-2 rounded-2xl bg-[#fff8de] p-3 font-lato text-xs text-secondary">
                    <EyeSlashIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Private — only people with the link can see it.
                    </span>
                  </div>
                )}
              </div>

              <div className="order-1 lg:order-2">
                <AttendeeList
                  attendees={displayedAttendees}
                  goingCount={displayedGoingCount}
                  currentUserId={profile?.id ?? currentUserId ?? null}
                />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
