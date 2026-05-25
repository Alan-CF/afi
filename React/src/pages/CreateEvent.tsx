import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  LinkIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventImagesUploader from "../components/events/EventImagesUploader";
import LocationPicker, {
  type PickedLocation,
} from "../components/events/LocationPicker";
import { createFanEvent } from "../lib/eventsApi";
import { useProfile } from "../hooks/useProfile";

const EVENT_TYPES = [
  "Watch Party",
  "Pickup Game",
  "Meetup",
  "Charity",
  "Other",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

function isoToLocalInput(iso: string) {
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

function formatDayTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StepProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map((index) => {
        const isCurrent = index === step;
        const isDone = index < step;
        return (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              isDone || isCurrent ? "bg-secondary" : "bg-[#e2e8f0]"
            }`}
          />
        );
      })}
    </div>
  );
}

interface SuccessModalProps {
  eventId: number;
  onClose: () => void;
  onGo: () => void;
}

function SuccessModal({ eventId, onClose, onGo }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/events/${eventId}`;

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-secondary">
            <CheckIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-anton text-2xl text-secondary leading-tight">
              Event created
            </h2>
            <p className="font-lato text-sm text-[#475569]">
              Your fan event is ready to share.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-secondary hover:text-white"
          >
            <LinkIcon className="h-4 w-4" />
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={onGo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d]"
          >
            Go to event
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user, hasLoadedOnce } = useProfile();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [eventType, setEventType] = useState<EventType>("Watch Party");
  const [isPublic, setIsPublic] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);

  useEffect(() => {
    if (!hasLoadedOnce) return;
    if (!user) navigate("/login", { replace: true });
  }, [hasLoadedOnce, user, navigate]);

  const minStart = useMemo(() => isoToLocalInput(new Date().toISOString()), []);

  const step2Valid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    imageFiles.length > 0;
  const step3Valid = startAt.length > 0 && location !== null;

  function canAdvanceFromCurrent(): boolean {
    if (step === 1) return true;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    return true;
  }

  function goNext() {
    if (!canAdvanceFromCurrent()) return;
    setStep((current) =>
      current === 4 ? current : ((current + 1) as 1 | 2 | 3 | 4)
    );
  }

  function goBack() {
    setStep((current) =>
      current === 1 ? current : ((current - 1) as 1 | 2 | 3 | 4)
    );
  }

  async function handleCreate() {
    if (!user || !location || imageFiles.length === 0) return;
    try {
      setSubmitting(true);
      setError(null);
      const parsedCapacity = capacity.trim()
        ? Number.parseInt(capacity, 10)
        : null;
      if (
        parsedCapacity != null &&
        (Number.isNaN(parsedCapacity) || parsedCapacity < 1)
      ) {
        throw new Error("Capacity must be a positive number.");
      }
      const eventId = await createFanEvent({
        title,
        description,
        venue: buildVenueLine(location),
        address: location.address || null,
        city: location.city || null,
        state: location.state || null,
        country: location.country || null,
        countryCode: location.countryCode || null,
        lat: Number.isFinite(location.lat) ? location.lat : null,
        lng: Number.isFinite(location.lng) ? location.lng : null,
        startAt,
        endAt: endAt || null,
        capacity: parsedCapacity,
        isPublic,
        tags: [eventType],
        imageFiles,
      });
      setCreatedEventId(eventId);
    } catch (err) {
      console.error("CreateEvent:", err);
      setError(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderStep1() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-anton text-lg text-secondary sm:text-xl">
            Event type
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => {
              const active = eventType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={`min-h-[42px] rounded-full border-2 px-4 py-2 font-lato text-sm font-bold transition-colors ${
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
          <h2 className="font-anton text-lg text-secondary sm:text-xl">
            Visibility
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex min-h-[72px] items-start gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                isPublic
                  ? "border-secondary bg-[#f6faff]"
                  : "border-[#c9d6ea] bg-white"
              }`}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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
                <span className="block font-lato text-xs font-bold text-[#475569]">
                  In Fan Events feed.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex min-h-[72px] items-start gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                !isPublic
                  ? "border-secondary bg-[#f6faff]"
                  : "border-[#c9d6ea] bg-white"
              }`}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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
                <span className="block font-lato text-xs font-bold text-[#475569]">
                  Link only.
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block font-anton text-lg text-secondary">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Warriors Watch Party"
            disabled={submitting}
            className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-base text-[#1f3668] placeholder:text-[#64748b] focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block font-anton text-lg text-secondary">
            Images
          </label>
          <EventImagesUploader
            files={imageFiles}
            onChange={setImageFiles}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="mb-2 block font-anton text-lg text-secondary">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's happening?"
            rows={4}
            disabled={submitting}
            className="w-full resize-y rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-base text-[#1f3668] placeholder:text-[#64748b] focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block font-anton text-lg text-secondary">
              Starts
            </label>
            <input
              type="datetime-local"
              value={startAt}
              min={minStart}
              onChange={(event) => setStartAt(event.target.value)}
              disabled={submitting}
              className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-base text-[#1f3668] focus:border-primary focus:outline-none"
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
              onChange={(event) => setEndAt(event.target.value)}
              disabled={submitting}
              className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-base text-[#1f3668] focus:border-primary focus:outline-none"
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
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="Optional"
            disabled={submitting}
            className="w-full rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-3 font-lato text-base text-[#1f3668] placeholder:text-[#64748b] focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block font-anton text-lg text-secondary">
            Location
          </label>
          <LocationPicker
            value={location}
            onChange={setLocation}
            disabled={submitting}
          />
        </div>
      </div>
    );
  }

  function renderStep4() {
    const coverFile = imageFiles[0];
    const coverPreview = coverFile ? URL.createObjectURL(coverFile) : null;
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-container-border bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="aspect-[16/9] w-full object-cover"
              onLoad={() => URL.revokeObjectURL(coverPreview)}
            />
          ) : (
            <div className="aspect-[16/9] w-full bg-secondary/10" />
          )}
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-secondary">
                {eventType}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] ${
                  isPublic
                    ? "bg-[#edf3ff] text-secondary"
                    : "bg-[#fff8de] text-secondary"
                }`}
              >
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
            <h3 className="mt-2 font-anton text-2xl text-secondary leading-tight">
              {title || "Untitled event"}
            </h3>
            <p className="mt-1 font-lato text-sm font-bold text-[#1f3668]">
              {formatDayTime(startAt)}
            </p>
            <p className="mt-1 font-lato text-sm font-bold text-[#475569] [overflow-wrap:anywhere]">
              {location
                ? [location.venue, location.city, location.country]
                    .filter(Boolean)
                    .join(", ")
                : "Location not set"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#f6f8fc] p-3 font-lato text-xs leading-5 text-[#475569]">
          By creating this event your @username
          {user?.username ? ` (@${user.username})` : ""} and event details
          will be visible to anyone who can view this event.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col px-3 py-3 sm:px-5 sm:py-6 xl:px-8">
        <section className="mx-auto flex w-full max-w-md flex-1 flex-col rounded-[1.75rem] bg-white/92 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm sm:max-w-xl sm:p-5 lg:max-w-3xl lg:p-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/events")}
              aria-label="Go back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-secondary transition-colors hover:bg-[#dfe9fb]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-lato text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#475569]">
                Step {step} of 4
              </p>
              <h1 className="font-anton text-2xl leading-tight text-[#1f3668] sm:text-3xl md:text-4xl">
                Host fan event
              </h1>
            </div>
          </div>

          <div className="mt-4">
            <StepProgressBar step={step} />
          </div>

          <div className="mt-6 flex flex-1 flex-col gap-5">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>

          {error && (
            <div className="mt-4 rounded-[1rem] bg-[#fff1f2] px-4 py-3 font-lato text-sm text-[#be123c]">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#edf3ff] disabled:opacity-60 sm:w-1/3"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceFromCurrent()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d] disabled:bg-[#b7c8df] disabled:text-white"
              >
                Continue
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  submitting || !step2Valid || !step3Valid
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d] disabled:bg-[#b7c8df] disabled:text-white"
              >
                {submitting ? "Creating event..." : "Create event"}
              </button>
            )}
          </div>
        </section>
      </main>

      {createdEventId != null && (
        <SuccessModal
          eventId={createdEventId}
          onClose={() => navigate(`/events/${createdEventId}`, { replace: true })}
          onGo={() =>
            navigate(`/events/${createdEventId}`, { replace: true })
          }
        />
      )}
    </div>
  );
}
