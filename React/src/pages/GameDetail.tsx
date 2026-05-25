import { useMemo } from "react";
import {
  ArrowLeftIcon,
  BoltIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { Link, useNavigate, useParams } from "react-router-dom";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import CourtLinePattern from "../components/common/CourtLinePattern";
import AttendButton from "../components/events/AttendButton";
import AttendeeList from "../components/events/AttendeeList";
import InviteFriendsButton from "../components/events/InviteFriendsButton";
import EventGallery from "../components/events/EventGallery";
import EventMapPreview from "../components/events/EventMapPreview";
import { useSeedAttendance } from "../hooks/useSeedAttendance";
import { useProfile } from "../hooks/useProfile";
import {
  getWarriorsGameDetail,
  type WarriorsGameAttendee,
} from "../lib/warriorsGameDetails";
import type { FanEventAttendee } from "../lib/eventsApi";

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const end = new Date(endIso);
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startTime} → ${endTime}`;
}

function gameAttendeeToFan(attendee: WarriorsGameAttendee): FanEventAttendee {
  return {
    id: attendee.id,
    fanEventId: 0,
    profileId: attendee.id,
    status: "going",
    createdAt: new Date().toISOString(),
    username: attendee.username,
    avatarUrl: attendee.avatarUrl,
  };
}

export default function GameDetail() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? getWarriorsGameDetail(gameId) : null;
  const { user: profile } = useProfile();
  const seedAttendance = useSeedAttendance(game?.id ?? null);

  const displayedAttendees: FanEventAttendee[] = useMemo(() => {
    if (!game) return [];
    const base = game.attendees.map(gameAttendeeToFan);
    if (
      seedAttendance.isAttending &&
      profile &&
      !base.some((a) => a.profileId === profile.id)
    ) {
      const me: FanEventAttendee = {
        id: `me-${profile.id}`,
        fanEventId: 0,
        profileId: profile.id,
        status: "going",
        createdAt: new Date().toISOString(),
        username: profile.username,
        avatarUrl: profile.avatar_url || null,
      };
      return [me, ...base];
    }
    return base;
  }, [game, seedAttendance.isAttending, profile]);

  const displayedGoingCount = useMemo(() => {
    if (!game) return 0;
    const base = game.attendees.length;
    if (
      seedAttendance.isAttending &&
      profile &&
      !game.attendees.some((a) => a.id === profile.id)
    ) {
      return base + 1;
    }
    return base;
  }, [game, seedAttendance.isAttending, profile]);

  async function handleToggleAttendance() {
    if (!game) return;
    await seedAttendance.toggle();
  }

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col bg-text-light-soft">
        <ScoreboardRibbon />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-12 md:px-6 lg:px-8">
          <div className="rounded-3xl border border-container-border bg-white p-8 text-center">
            <p className="font-lato text-base text-text">Game not found.</p>
            <button
              type="button"
              onClick={() => navigate("/events")}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary"
            >
              Back to events
            </button>
          </div>
        </main>
      </div>
    );
  }

  const eventPath = `/events/game/${game.id}`;

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
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-container-border bg-gradient-to-br from-white via-[#f6faff] to-[#e8efff] p-6 shadow-[0_18px_44px_rgba(29,66,138,0.12)] sm:p-8 md:p-10">
              <CourtLinePattern className="pointer-events-none absolute inset-y-0 right-[-25%] h-full w-[80%] opacity-[0.08] sm:right-[-15%] sm:w-[70%]" />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-secondary/15 blur-3xl"
              />

              <div className="relative flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary shadow-[0_8px_20px_rgba(29,66,138,0.25)]">
                  <BoltIcon className="h-3 w-3" />
                  Game Day
                </span>
              </div>

              <div className="relative mt-6 flex w-full items-center justify-center gap-4 sm:gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.12)] sm:p-4">
                    <img
                      src={game.warriorsLogo}
                      alt="Warriors"
                      className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-40 md:w-40"
                    />
                  </div>
                  <p className="font-anton text-base text-secondary tracking-[0.18em]">
                    GSW
                  </p>
                </div>
                <p className="font-anton text-5xl leading-none text-secondary drop-shadow-[0_4px_10px_rgba(29,66,138,0.18)] sm:text-6xl md:text-7xl">
                  {game.isHome ? "vs" : "@"}
                </p>
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.12)] sm:p-4">
                    <img
                      src={game.opponentLogo}
                      alt={game.opponentName}
                      className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-40 md:w-40"
                    />
                  </div>
                  <p className="font-anton text-base text-secondary tracking-[0.18em]">
                    {game.opponentAbbr}
                  </p>
                </div>
              </div>

              <div className="relative mt-7 text-center">
                <h1 className="font-anton text-3xl leading-[1.05] text-secondary sm:text-4xl md:text-5xl">
                  {game.matchup}
                </h1>
                <p className="mt-2 font-lato text-sm font-bold text-[#1f3668]">
                  {[game.city, game.state, game.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-lato text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,66,138,0.25)]">
                    <CalendarDaysIcon className="h-4 w-4 text-primary" />
                    {formatDayLabel(game.startAt)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-lato text-sm font-bold text-secondary shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
                    <ClockIcon className="h-4 w-4" />
                    {formatTimeRange(game.startAt, game.endAt)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-lato text-sm font-bold text-secondary shadow-[0_6px_16px_rgba(255,199,44,0.35)]">
                    {game.broadcast}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-container-border bg-secondary">
              <img
                src={game.stadiumImageUrl}
                alt={game.venue}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/85 via-black/35 to-transparent" />
              <div className="relative flex aspect-[21/9] flex-col justify-end p-5 text-white sm:p-7">
                <p className="font-lato text-[0.62rem] font-bold uppercase tracking-[0.22em] text-primary">
                  The Venue
                </p>
                <h2 className="mt-1 font-anton text-2xl leading-tight sm:text-3xl">
                  {game.venue}
                </h2>
                <p className="mt-1 font-lato text-sm font-bold text-white/90 [overflow-wrap:anywhere]">
                  {[game.city, game.state].filter(Boolean).join(", ")}
                  {game.capacity
                    ? ` · ${game.capacity.toLocaleString()} seats`
                    : ""}
                </p>
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
                      Tip-off
                    </p>
                    <p className="mt-0.5 font-anton text-base text-secondary leading-tight sm:text-lg">
                      {formatDayLabel(game.startAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-[#f6f8fc] p-3">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <p className="font-lato text-sm font-bold text-secondary">
                    {formatTimeRange(game.startAt, game.endAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8fc] p-3">
                  <UsersIcon className="h-4 w-4 shrink-0 text-secondary" />
                  <p className="font-lato text-sm font-bold text-secondary tabular-nums">
                    {displayedGoingCount} going
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#fff8de] p-3">
                  <p className="font-lato text-xs font-bold text-[#1f3668]">
                    Broadcast
                    <span className="ml-2 text-secondary">{game.broadcast}</span>
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
                      {game.venue}
                    </p>
                  </div>
                </div>
                <p className="font-lato text-xs font-bold text-[#475569] [overflow-wrap:anywhere]">
                  {[game.city, game.state, game.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <EventMapPreview
                  lat={game.lat}
                  lng={game.lng}
                  label={game.venue}
                  height="h-36 md:h-44"
                  rounded="rounded-2xl"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5">
              <h2 className="font-anton text-lg text-secondary sm:text-xl">
                About this game
              </h2>
              <p className="mt-3 whitespace-pre-wrap font-lato text-sm leading-6 text-[#1f3668]">
                {game.description}
              </p>
            </section>

            <EventGallery images={game.galleryImageUrls} alt={game.matchup} />
          </article>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <div className="order-2 flex flex-col gap-3 rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-5 lg:order-1">
              <AttendButton
                isLoggedIn={!!profile}
                isAttending={seedAttendance.isAttending}
                onToggle={handleToggleAttendance}
              />
              <InviteFriendsButton eventPath={eventPath} />
              <Link
                to="/rooms"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-secondary hover:text-white"
              >
                {game.watchRoomCta}
              </Link>
            </div>

            <div className="order-1 lg:order-2">
              <AttendeeList
                attendees={displayedAttendees}
                goingCount={displayedGoingCount}
                currentUserId={profile?.id ?? null}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
