import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XMarkIcon, CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { supabase } from "../../lib/supabaseClient";
import { resolveFrameImage } from "../../data/frames";
import AvatarFrame from "./AvatarFrame";

type OwnedFrame = {
  id: string;
  name: string;
  image_path: string;
  imageUrl: string | null;
};

interface FramePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current saved frame id from server. */
  currentFrameId: string | null;
  avatarUrl?: string | null;
  username: string;
  /** Called after server confirms the new selection. */
  onSaved: (newFrameId: string | null) => void;
}

export default function FramePickerModal({
  isOpen,
  onClose,
  currentFrameId,
  avatarUrl,
  username,
  onSaved,
}: FramePickerModalProps) {
  const navigate = useNavigate();
  const [owned, setOwned] = useState<OwnedFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftFrameId, setDraftFrameId] = useState<string | null>(currentFrameId);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync draft + reset state every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDraftFrameId(currentFrameId);
    setSuccess(false);
    setError(null);
  }, [isOpen, currentFrameId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setError("Sign in to manage frames.");
          setLoading(false);
        }
        return;
      }
      const { data, error: err } = await supabase
        .from("owned_frames")
        .select("frame_id, frames(id, name, image_path, sort_order)")
        .eq("profile_id", user.id);

      if (cancelled) return;
      if (err) {
        setError("Could not load your frames.");
        setOwned([]);
      } else {
        const rows: (OwnedFrame & { sort_order: number })[] = [];
        for (const row of (data as any[] | null) ?? []) {
          const f = row.frames;
          if (!f) continue;
          rows.push({
            id: f.id,
            name: f.name,
            image_path: f.image_path,
            imageUrl: resolveFrameImage(f.image_path),
            sort_order: f.sort_order ?? 0,
          });
        }
        rows.sort((a, b) => a.sort_order - b.sort_order);
        setOwned(rows);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const dirty = useMemo(
    () => draftFrameId !== currentFrameId,
    [draftFrameId, currentFrameId]
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.rpc("select_frame", {
      p_frame_id: draftFrameId,
    });
    setSaving(false);
    if (err) {
      setError("Could not save frame. Try again.");
      return;
    }
    setSuccess(true);
    window.dispatchEvent(new CustomEvent("profile-updated"));
    onSaved(draftFrameId);
    window.setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-container-border px-5 py-4">
          <h2 className="font-anton text-xl text-secondary">Choose a Frame</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-text-light transition-colors hover:bg-text-light-soft hover:text-secondary"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col items-center gap-2 bg-text-light-soft px-6 pt-5 pb-4">
          <AvatarFrame frameId={draftFrameId} size={96} scale={1.3}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-2xl font-extrabold text-white">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </AvatarFrame>
          <p className="font-lato text-xs uppercase tracking-widest text-text-light">
            Preview
          </p>
        </div>

        <div className="max-h-[42vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-text-light-soft"
                />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center font-lato text-sm text-destructive-dark">
              {error}
            </p>
          ) : owned.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <SparklesIcon className="h-8 w-8 text-primary" />
              <p className="font-lato text-sm text-text">
                You don't own any frames yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/eshop");
                }}
                className="rounded-xl bg-primary px-4 py-2 font-lato text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-primary-dark"
              >
                Visit eShop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDraftFrameId(null)}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2 transition-colors ${
                  draftFrameId === null
                    ? "border-primary bg-primary/10"
                    : "border-container-border hover:border-secondary"
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-text-light">
                  <span className="font-lato text-[10px] uppercase text-text-light">
                    None
                  </span>
                </div>
                <span className="font-lato text-[11px] font-semibold text-secondary">
                  No frame
                </span>
              </button>

              {owned.map((frame) => {
                const isDraft = draftFrameId === frame.id;
                const isCurrent = currentFrameId === frame.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setDraftFrameId(frame.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl border p-2 transition-colors ${
                      isDraft
                        ? "border-primary bg-primary/10"
                        : "border-container-border hover:border-secondary"
                    }`}
                  >
                    <AvatarFrame frameId={frame.id} size={48} scale={1.3}>
                      <div className="h-12 w-12 rounded-full bg-secondary" />
                    </AvatarFrame>
                    <span className="font-lato text-[11px] font-semibold text-secondary text-center leading-tight">
                      {frame.name}
                    </span>
                    {isCurrent ? (
                      <span className="absolute -top-1 -right-1 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Active
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {success ? (
          <div className="flex items-center gap-2 border-t border-success/20 bg-success/10 px-5 py-3 font-lato text-sm font-semibold text-success-dark">
            <CheckCircleIcon className="h-5 w-5" />
            Frame saved!
          </div>
        ) : null}

        <footer className="flex items-center justify-end gap-2 border-t border-container-border bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 font-lato text-sm font-bold uppercase tracking-wider text-text-light transition-colors hover:bg-text-light-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty || loading || !!error}
            className="rounded-xl bg-primary px-4 py-2 font-lato text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
