import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  LockClosedIcon,
  PhotoIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LocationPicker, {
  type PickedLocation,
} from "../components/events/LocationPicker";
import {
  deleteEventImage,
  deleteFanEvent,
  fetchFanEventDetail,
  listEventImages,
  setEventMainImage,
  updateFanEvent,
  uploadEventImage,
  validateEventImageFile,
  ValidationError,
  type FanEventDetail,
  type FanEventImage,
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
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [existingImages, setExistingImages] = useState<FanEventImage[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const newImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (validId == null) return;
    listEventImages(validId)
      .then(setExistingImages)
      .catch((err) => {
        console.error("listEventImages:", err);
      });
  }, [validId]);

  useEffect(() => {
    const urls = newImageFiles.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [newImageFiles]);

  const visibleExisting = existingImages.filter(
    (img) => !pendingDeleteIds.includes(img.id)
  );

  function handleMarkRemove(id: number) {
    setPendingDeleteIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
    setImageError(null);
  }

  function handleAddImages(event: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (list.length === 0) return;
    const valid: File[] = [];
    let lastError: string | null = null;
    for (const file of list) {
      const error = validateEventImageFile(file);
      if (error) {
        lastError = error;
        continue;
      }
      valid.push(file);
    }
    if (lastError) setImageError(lastError);
    if (valid.length > 0) {
      setNewImageFiles((current) => [...current, ...valid]);
      setImageError(lastError);
    }
  }

  function handleRemoveNew(index: number) {
    setNewImageFiles((current) => current.filter((_, i) => i !== index));
    setImageError(null);
  }

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

  function requestDelete() {
    if (!event || !isOrganizer || deleting) return;
    setConfirmingDelete(true);
  }

  async function confirmDelete() {
    if (!event || !isOrganizer || deleting) return;
    try {
      setDeleting(true);
      setSubmitError(null);
      await deleteFanEvent(event.id);
      setConfirmingDelete(false);
      setDeleteSuccess(true);
    } catch (err) {
      console.error("EditEvent delete:", err);
      setSubmitError("Couldn't delete event. Please try again later.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

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
        throw new ValidationError("Capacity must be a positive number.");
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
              city: location.city || null,
              country: location.country || null,
            }),
      });

      const removedImages = existingImages.filter((img) =>
        pendingDeleteIds.includes(img.id)
      );
      for (const image of removedImages) {
        try {
          await deleteEventImage(image);
        } catch (err) {
          console.error("EditEvent delete image:", err);
        }
      }

      const remainingExisting = existingImages.filter(
        (img) => !pendingDeleteIds.includes(img.id)
      );
      const maxSort = remainingExisting.reduce(
        (acc, img) => Math.max(acc, img.sortOrder),
        -1
      );

      const uploadedImages: FanEventImage[] = [];
      for (let i = 0; i < newImageFiles.length; i++) {
        try {
          const uploaded = await uploadEventImage(
            event.id,
            newImageFiles[i],
            maxSort + 1 + i
          );
          uploadedImages.push(uploaded);
        } catch (err) {
          console.error("EditEvent upload image:", err);
        }
      }

      const coverCandidate = remainingExisting[0] ?? uploadedImages[0] ?? null;
      if (coverCandidate) {
        try {
          await setEventMainImage(event.id, coverCandidate);
        } catch (err) {
          console.error("EditEvent set main image:", err);
        }
      }

      navigate(`/events/${event.id}`, { replace: true });
    } catch (err) {
      console.error("EditEvent:", err);
      if (err instanceof ValidationError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Couldn't save changes. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <main className="flex min-h-[calc(100vh-72px)] w-full flex-col px-4 sm:px-8 py-3 sm:py-6">
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
                  Images
                </label>
                <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#c9d6ea] bg-white p-3">
                  {visibleExisting.length === 0 &&
                  newImageFiles.length === 0 ? (
                    <p className="font-lato text-xs text-[#475569]">
                      No images yet. Add one below.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {visibleExisting.map((image, index) => (
                        <div
                          key={image.id}
                          className="relative aspect-square overflow-hidden rounded-xl border border-container-border bg-[#f6f8fc]"
                        >
                          <img
                            src={image.imageUrl}
                            alt={`Existing ${index + 1}`}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                          />
                          {index === 0 && (
                            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-lato text-[0.55rem] font-bold uppercase tracking-[0.16em] text-secondary">
                              <StarIcon className="h-3 w-3" />
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMarkRemove(image.id)}
                            disabled={submitting}
                            aria-label="Remove image"
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[#be123c] shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {newImagePreviews.map((url, index) => (
                        <div
                          key={`new-${url}-${index}`}
                          className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-secondary/40 bg-[#f6faff]"
                        >
                          <img
                            src={url}
                            alt={`New ${index + 1}`}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-secondary px-2 py-0.5 font-lato text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white">
                            New
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNew(index)}
                            disabled={submitting}
                            aria-label="Remove new image"
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[#be123c] shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => newImageInputRef.current?.click()}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] px-4 py-2 font-lato text-xs font-bold uppercase tracking-[0.08em] text-secondary transition-colors hover:border-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    <PhotoIcon className="h-3.5 w-3.5" />
                    Add photo
                  </button>
                  <input
                    ref={newImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                    disabled={submitting}
                  />
                  {imageError && (
                    <p className="font-lato text-xs text-[#be123c]">
                      {imageError}
                    </p>
                  )}
                </div>
              </div>

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

              <button
                type="button"
                onClick={requestDelete}
                disabled={submitting || deleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#be123c] py-3 font-lato text-sm font-bold text-[#be123c] transition-colors hover:bg-[#be123c] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete event"}
              </button>

              <div className="sticky bottom-0 mt-3 flex flex-col gap-2 bg-white/92 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    navigate(event ? `/events/${event.id}` : "/events")
                  }
                  disabled={submitting || deleting}
                  className="w-full rounded-[1.2rem] border-2 border-secondary py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#edf3ff] disabled:opacity-60 sm:py-4 sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || deleting}
                  className="w-full rounded-[1.2rem] bg-primary py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d] disabled:bg-[#b7c8df] disabled:text-white sm:py-4 sm:text-base"
                >
                  {submitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      {confirmingDelete && event && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!deleting) setConfirmingDelete(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.25)]"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f2] text-[#be123c]">
                <TrashIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-anton text-2xl text-secondary leading-tight">
                  Delete event
                </h2>
                <p className="font-lato text-sm text-[#475569]">
                  This cannot be undone.
                </p>
              </div>
            </div>
            <p className="mt-5 font-lato text-sm text-[#1f3668]">
              Delete{" "}
              <span className="font-bold">"{event.title}"</span>? Attendees will
              lose access and all images will be removed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#be123c] px-5 py-3 font-lato text-sm font-bold text-white transition-colors hover:bg-[#9f1239] disabled:opacity-60"
              >
                <TrashIcon className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete event"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-secondary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#edf3ff] disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_30px_70px_rgba(15,23,42,0.25)]"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-secondary">
              <CheckIcon className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-anton text-2xl text-secondary leading-tight">
              Event deleted
            </h2>
            <p className="mt-1 font-lato text-sm text-[#475569]">
              The event and its images have been removed.
            </p>
            <button
              type="button"
              onClick={() => navigate("/events", { replace: true })}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d]"
            >
              Back to events
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
