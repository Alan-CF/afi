import { useEffect, useMemo, useRef, useState } from "react";
import {
  PhotoIcon,
  PlusIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { validateEventImageFile } from "../../lib/eventsApi";

interface Props {
  coverFile: File | null;
  galleryFiles: File[];
  onCoverChange: (file: File | null) => void;
  onGalleryChange: (files: File[]) => void;
  disabled?: boolean;
  maxGallery?: number;
}

interface PreviewEntry {
  file: File;
  url: string;
}

function buildPreviews(files: File[]): PreviewEntry[] {
  return files.map((file) => ({ file, url: URL.createObjectURL(file) }));
}

export default function EventGalleryUploader({
  coverFile,
  galleryFiles,
  onCoverChange,
  onGalleryChange,
  disabled,
  maxGallery = 5,
}: Props) {
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const galleryPreviews = useMemo(
    () => buildPreviews(galleryFiles),
    [galleryFiles]
  );

  useEffect(() => {
    return () => {
      for (const preview of galleryPreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [galleryPreviews]);

  function handlePickCover() {
    if (disabled) return;
    coverInputRef.current?.click();
  }

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!next) return;
    const validation = validateEventImageFile(next);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onCoverChange(next);
  }

  function handleClearCover() {
    if (disabled) return;
    onCoverChange(null);
    setError(null);
  }

  function handlePickGallery() {
    if (disabled) return;
    galleryInputRef.current?.click();
  }

  function handleGalleryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (incoming.length === 0) return;

    const next: File[] = [...galleryFiles];
    let lastError: string | null = null;
    for (const file of incoming) {
      if (next.length >= maxGallery) {
        lastError = `You can upload up to ${maxGallery} extra photos.`;
        break;
      }
      const validation = validateEventImageFile(file);
      if (validation) {
        lastError = validation;
        continue;
      }
      next.push(file);
    }
    setError(lastError);
    onGalleryChange(next);
  }

  function handleRemoveGallery(index: number) {
    if (disabled) return;
    const next = galleryFiles.filter((_, i) => i !== index);
    onGalleryChange(next);
    setError(null);
  }

  function handlePromote(index: number) {
    if (disabled) return;
    const next = [...galleryFiles];
    const [promoted] = next.splice(index, 1);
    const demoted = coverFile;
    onCoverChange(promoted);
    if (demoted) {
      onGalleryChange([demoted, ...next]);
    } else {
      onGalleryChange(next);
    }
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          type="button"
          onClick={handlePickCover}
          disabled={disabled}
          className={`relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] transition-colors hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:cursor-not-allowed disabled:opacity-60 ${
            coverPreview ? "border-solid border-secondary/40" : ""
          }`}
        >
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <PhotoIcon className="h-5 w-5" />
              </span>
              <span className="font-lato text-sm font-bold text-secondary">
                Upload cover image
              </span>
              <span className="font-lato text-xs text-[#6b7a90]">
                JPG, PNG, or WEBP · max 5 MB
              </span>
            </div>
          )}

          {coverPreview && !disabled && (
            <span
              role="button"
              aria-label="Remove cover"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleClearCover();
              }}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-secondary shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
            >
              <XMarkIcon className="h-4 w-4" />
            </span>
          )}

          {coverPreview && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.16em] text-secondary">
              <StarIcon className="h-3 w-3" />
              Cover
            </span>
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverChange}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-lato text-sm font-bold text-secondary">
            More photos
          </p>
          <span className="rounded-full bg-[#edf3ff] px-3 py-1 font-lato text-xs font-bold text-secondary tabular-nums">
            {galleryFiles.length}/{maxGallery}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {galleryPreviews.map((entry, index) => (
            <div
              key={entry.url}
              className="relative aspect-square overflow-hidden rounded-2xl border border-container-border bg-white"
            >
              <img
                src={entry.url}
                alt={`Gallery preview ${index + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => handlePromote(index)}
                    className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 font-lato text-[0.6rem] font-bold uppercase tracking-[0.16em] text-secondary shadow-sm transition-colors hover:bg-white"
                  >
                    <StarIcon className="h-3 w-3" />
                    Cover
                  </button>
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => handleRemoveGallery(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-secondary shadow-sm transition-colors hover:bg-white"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}

          {galleryFiles.length < maxGallery && (
            <button
              type="button"
              onClick={handlePickGallery}
              disabled={disabled}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] font-lato text-xs font-bold text-secondary transition-colors hover:border-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="h-5 w-5" />
              Add photo
            </button>
          )}
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleGalleryChange}
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="font-lato text-xs text-[#be123c]">{error}</p>
      )}
    </div>
  );
}
