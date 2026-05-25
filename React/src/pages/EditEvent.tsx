import {
  ArrowLeftIcon,
  EyeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LocationPicker, {
  type PickedLocation,
} from "../components/events/LocationPicker";
import {
  fetchFanEventDetail,
  updateFanEvent,
  type FanEventDetail,
} from "../lib/eventsApi";
import { useProfile } from "../hooks/useProfile";

const EVENT_TYPES = [
  "Watch Party",
  "Pickup Game",
  "Meetup",
  "Charity",
  "Other",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

function isoToLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function buildVenueLine(location: PickedLocation): string {
  if (location.venue.trim()) return location.venue.trim();
  return location.displayName;
}

function pickInitialType(tags: string[]): EventType {
  const first = tags[0];
  if (!first) return "Other";
  const match = EVENT_TYPES.find(
    (type) => type.toLowerCase() === first.toLowerCase()
  );
  return match ?? "Other";
}

export default function EditEvent() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const parsedId = eventId ? Number.parseInt(eventId, 10) : Number.NaN;
  const validId = Number.isFinite(parsedId) ? parsedId : null;
  const { user, hasLoadedOnce } = useProfile();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [event, setEvent] = useState<FanEventDetail | null>(null);

  const [eventType, setEventType] = useState<EventType>("Watch Party");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [keepExistingLocation, setKeepExistingLocation] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasLoadedOnce) return;
    if (!user) navigate("/login", { replace: true });
  }, [hasLoadedOnce, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (validId == null) {
        setLoadError("Event not found.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLoadError(null);
        const data = await fetchFanEventDetail(validId);
        if (cancelled) return;
        if (!data) {
          setLoadError("Event not found.");
          return;
        }
        if (data.source !== "db") {
          setLoadError("This event cannot be edited.");
          return;
        }
        setEvent(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCapacity(data.capacity != null ? String(data.capacity) : "");
        setStartAt(isoToLocalInput(data.startAt));
        setEndAt(isoToLocalInput(data.endAt));
        setIsPublic(data.isPublic);
        setEventType(pickInitialType(data.tags));
      } catch (err) {
        if (cancelled) return;
        console.error("EditEvent load:", err);
        setLoadError(
          err instanceof Error ? err.message : "Could not load event."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [validId]);

  const isOrganizer =
    !!event && !!user && event.organizerProfileId === user.id;

  const minStart = useMemo(() => isoToLocalInput(new Date().toISOString()), []);

  const canSubmit =
    !!event &&
    isOrganizer &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    startAt.length > 0 &&
    !submitting;

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!canSubmit || !event) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      const parsedCapacity = capacity.trim()
        ? Number.parseInt(capacity, 10)
        : null;
      if (
        parsedCapacity != null &&
        (Number.isNaN(parsedCapacity) || parsedCapacity < 1)
      ) {
        throw new Error("Capacity must be a positive number.");
      }
      await updateFanEvent(event.id, {
        title,
        description,
        startAt,
        endAt: endAt || null,
        capacity: parsedCapacity,
        isPublic,
        tags: [eventType],
        ...(keepExistingLocation || !location
          ? {}
          : {
              venue: buildVenueLine(location),
              address: location.address || null,
              city: location.city || null,
              state: location.state || null,
              country: location.country || null,
              countryCode: location.countryCode || null,
              lat: Number.isFinite(location.lat) ? location.lat : null,
              lng: Number.isFinite(location.lng) ? location.lng : null,
            }),
      });
      navigate(`/events/${event.id}`, { replace: true });
    } catch (err) {
      console.error("EditEvent:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Could not save changes."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col px-3 py-3 sm:px-5 sm:py-6 xl:px-8">
        <section className="mx-auto flex w-full max-w-md flex-1 flex-col rounded-[1.75rem] bg-white/92 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm sm:max-w-xl sm:p-5 lg:max-w-3xl lg:p-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(event ? `/events/${event.id}` : "/events")}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ff] text-secondary transition-colors hover:bg-[#dfe9fb]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <p className="font-lato text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#475569]">
                Edit
              </p>
              <h1 className="font-anton text-2xl leading-tight text-[#1f3668] sm:text-3xl md:text-4xl">
                Edit event
              </h1>
            </div>
          </div>

          {loading && (
            <div className="mt-8 space-y-3">
              <div className="h-10 w-2/3 rounded-2xl skeleton-shimmer" />
              <div className="h-32 w-full rounded-2xl skeleton-shimmer" />
              <div className="h-10 w-1/2 rounded-2xl skeleton-shimmer" />
            </div>
          )}

          {!loading && loadError && (
            <div className="mt-8 rounded-2xl bg-[#fff1f2] px-4 py-3 font-lato text-sm text-[#be123c]">
              {loadError}
            </div>
          )}

          {!loading && !loadError && event && !isOrganizer && (
            <div className="mt-8 rounded-2xl bg-[#fff8de] px-4 py-3 font-lato text-sm text-secondary">
              Only the organizer can edit this event.
            </div>
          )}

          {!loading && !loadError && event && isOrganizer && (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-1 flex-col gap-5"
            >
              <div>
                <label className="mb-2 block font-anton text-lg text-secondary">
                  Event type
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((type) => {
                    const active = eventType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEventType(type)}
                        className={`rounded-full border-2 px-3 py-1.5 font-lato text-xs font-bold transition-colors ${
                          active
                            ? "border-secondary bg-secondary text-white"
                            : "border-[#c9d6ea] bg-white text-secondary hover:border-secondary"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-anton text-lg text-secondary">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(formEvent) => setTitle(formEvent.target.value)}
                  disabled={submitting}
                  className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-sm text-[#1f3668] focus:border-primary focus:outline-none sm:text-base"
                />
              </div>

              <div>
                <label className="mb-2 block font-anton text-lg text-secondary">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(formEvent) =>
                    setDescription(formEvent.target.value)
                  }
                  rows={5}
                  disabled={submitting}
                  className="w-full resize-y rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-sm text-[#1f3668] focus:border-primary focus:outline-none sm:text-base"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-anton text-lg text-secondary">
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setKeepExistingLocation((current) => !current);
                      if (keepExistingLocation) {
                        setLocation(null);
                      }
                    }}
                    className="font-lato text-xs font-bold text-secondary hover:underline"
                  >
                    {keepExistingLocation ? "Change" : "Keep current"}
                  </button>
                </div>
                {keepExistingLocation ? (
                  <div className="rounded-2xl border border-secondary/20 bg-[#f6faff] p-4">
                    <p className="font-lato text-sm font-bold text-secondary">
                      {event.venue ?? "Location TBA"}
                    </p>
                    <p className="mt-1 font-lato text-xs text-[#475569] [overflow-wrap:anywhere]">
                      {[event.city, event.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ) : (
                  <LocationPicker
                    value={location}
                    onChange={setLocation}
                    disabled={submitting}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-anton text-lg text-secondary">
                    Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    min={minStart}
                    onChange={(formEvent) => setStartAt(formEvent.target.value)}
                    disabled={submitting}
                    className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-sm text-[#1f3668] focus:border-primary focus:outline-none sm:text-base"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-anton text-lg text-secondary">
                    Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    min={startAt || minStart}
                    onChange={(formEvent) => setEndAt(formEvent.target.value)}
                    disabled={submitting}
                    className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-sm text-[#1f3668] focus:border-primary focus:outline-none sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-anton text-lg text-secondary">
                  Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(formEvent) => setCapacity(formEvent.target.value)}
                  placeholder="Optional"
                  disabled={submitting}
                  className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-sm text-[#1f3668] placeholder:text-[#94a3b8] focus:border-primary focus:outline-none sm:text-base"
                />
              </div>

              <div>
                <label className="mb-2 block font-anton text-lg text-secondary">
                  Visibility
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    disabled={submitting}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-colors disabled:opacity-60 ${
                      isPublic
                        ? "border-secondary bg-[#f6faff]"
                        : "border-[#c9d6ea] bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isPublic
                          ? "bg-primary text-secondary"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-lato text-sm font-bold text-secondary">
                        Public
                      </span>
                      <span className="block font-lato text-xs text-[#475569]">
                        Appears in Fan Events.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    disabled={submitting}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-colors disabled:opacity-60 ${
                      !isPublic
                        ? "border-secondary bg-[#f6faff]"
                        : "border-[#c9d6ea] bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        !isPublic
                          ? "bg-primary text-secondary"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      <LockClosedIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-lato text-sm font-bold text-secondary">
                        Private
                      </span>
                      <span className="block font-lato text-xs text-[#475569]">
                        Only people with the link can see it.
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {submitError && (
                <div className="rounded-[1rem] bg-[#fff1f2] px-4 py-3 font-lato text-sm text-[#be123c]">
                  {submitError}
                </div>
              )}

              <div className="sticky bottom-0 mt-3 flex flex-col gap-2 bg-white/92 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    navigate(event ? `/events/${event.id}` : "/events")
                  }
                  disabled={submitting}
                  className="w-full rounded-[1.2rem] border-2 border-secondary py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#edf3ff] disabled:opacity-60 sm:py-4 sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-[1.2rem] bg-primary py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d] disabled:bg-[#b7c8df] disabled:text-white sm:py-4 sm:text-base"
                >
                  {submitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
