import { useMemo } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  SignalIcon,
} from "@heroicons/react/24/solid";
import { Link, useNavigate, useParams } from "react-router-dom";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
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
    year: "numeric",
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
  return `${startTime} - ${endTime}`;
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
    frameId: null,
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
      !game.isPast &&
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
        frameId: profile.selected_frame_id ?? null,
      };
      return [me, ...base];
    }
    return base;
  }, [game, seedAttendance.isAttending, profile]);

  const displayedGoingCount = useMemo(() => {
    if (!game) return 0;
    const base = game.attendees.length;
    if (
      !game.isPast &&
      seedAttendance.isAttending &&
      profile &&
      !game.attendees.some((a) => a.id === profile.id)
    ) {
      return base + 1;
    }
    return base;
  }, [game, seedAttendance.isAttending, profile]);

  async function handleToggleAttendance() {
    if (!game || game.isPast) return;
    await seedAttendance.toggle();
  }

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col bg-text-light-soft">
        <ScoreboardRibbon />
        <main className="w-full flex-1 px-4 sm:px-8 py-12">
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
  const hasFinalScore =
    !!game.isPast &&
    typeof game.finalWarriorsScore === "number" &&
    typeof game.finalOpponentScore === "number";
  const warriorsWon =
    hasFinalScore &&
    (game.finalWarriorsScore as number) > (game.finalOpponentScore as number);

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />

      <main className="flex-1 w-full px-4 sm:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
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
          <article className="flex flex-col gap-5">
            <div className="rounded-3xl border border-container-border bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:p-8 md:p-10">
              <div className="h-1 w-12 mx-auto rounded-full bg-primary" />

              <div className="mt-5 flex w-full items-center justify-center gap-5 sm:gap-10">
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={game.warriorsLogo}
                    alt="Warriors"
                    className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-40 md:w-40"
                  />
                  <p className="font-anton text-base text-secondary tracking-[0.18em]">
                    GSW
                  </p>
                </div>
                <p className="font-anton text-5xl leading-none text-secondary sm:text-6xl md:text-7xl">
                  {game.isHome ? "vs" : "@"}
                </p>
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={game.opponentLogo}
                    alt={game.opponentName}
                    className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-40 md:w-40"
                  />
                  <p className="font-anton text-base text-secondary tracking-[0.18em]">
                    {game.opponentAbbr}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h1 className="font-anton text-3xl leading-[1.05] text-secondary sm:text-4xl md:text-5xl">
                  {game.matchup}
                </h1>
                {hasFinalScore && (
                  <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-[#f6f8fc] px-4 py-2">
                    <span className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#475569]">
                      Final
                    </span>
                    <span className="font-anton text-2xl tabular-nums text-secondary">
                      {game.finalWarriorsScore} - {game.finalOpponentScore}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.18em] ${
                        warriorsWon
                          ? "bg-secondary text-primary"
                          : "bg-[#fff1f2] text-[#be123c]"
                      }`}
                    >
                      {warriorsWon ? "W" : "L"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <section className="flex flex-col gap-4 rounded-3xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:hidden">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <CalendarDaysIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                    Date
                  </p>
                  <p className="mt-0.5 font-anton text-base text-secondary leading-tight">
                    {formatDayLabel(game.startAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <ClockIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                    Tip-off
                  </p>
                  <p className="mt-0.5 font-anton text-base text-secondary leading-tight">
                    {formatTimeRange(game.startAt, game.endAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <SignalIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                    Broadcast
                  </p>
                  <p className="mt-0.5 font-anton text-base text-secondary leading-tight">
                    {game.broadcast}
                  </p>
                </div>
              </div>
            </section>

            <section className="hidden gap-4 sm:grid sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-3xl border border-container-border bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <CalendarDaysIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                    Date
                  </p>
                  <p className="mt-0.5 font-anton text-base text-secondary leading-tight">
                    {formatDayLabel(game.startAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-container-border bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <ClockIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                    Tip-off
                  </p>
                  <p className="mt-0.5 font-anton text-base text-secondary leading-tight">
                    {formatTimeRange(game.startAt, game.endAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-container-border bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <SignalIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#475569]">
                    Broadcast
                  </p>
                  <p className="mt-0.5 font-anton text-base text-secondary leading-tight">
                    {game.broadcast}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-container-border bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              {game.coverImageUrl && (
                <img
                  src={game.coverImageUrl}
                  alt={game.venue}
                  className="aspect-[21/9] w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
              <div className="flex flex-col gap-4 p-4 sm:p-5">
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
                    <p className="mt-1 font-lato text-xs font-bold text-[#475569] [overflow-wrap:anywhere]">
                      {[game.city, game.state, game.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <EventMapPreview
                  lat={game.lat}
                  lng={game.lng}
                  label={game.venue}
                  height="h-56 md:h-72 lg:h-80"
                  rounded="rounded-2xl"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-container-border bg-white p-4 sm:p-5">
              <h2 className="font-anton text-lg text-secondary sm:text-xl">
                About this game
              </h2>
              <p className="mt-3 whitespace-pre-wrap font-lato text-sm leading-6 text-[#1f3668]">
                {game.description}
              </p>
            </section>

            <EventGallery images={game.galleryImageUrls} alt={game.matchup} />
          </article>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start lg:z-10">
            <div className="order-2 flex flex-col gap-3 rounded-3xl border border-container-border bg-white p-4 sm:p-5 lg:order-1">
              {game.isPast ? (
                <div className="rounded-2xl bg-[#f6f8fc] p-3 text-center font-lato text-sm font-bold text-secondary">
                  Game completed
                </div>
              ) : (
                <AttendButton
                  isLoggedIn={!!profile}
                  isAttending={seedAttendance.isAttending}
                  onToggle={handleToggleAttendance}
                />
              )}
              <InviteFriendsButton eventPath={eventPath} />
              {!game.isPast && (
                <Link
                  to="/rooms"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-secondary hover:text-white"
                >
                  {game.watchRoomCta}
                </Link>
              )}
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
