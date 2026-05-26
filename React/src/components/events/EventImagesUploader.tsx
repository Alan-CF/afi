import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PhotoIcon,
  PlusIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { validateEventImageFile } from "../../lib/eventsApi";

interface Props {
  files: File[];
  onChange: (next: File[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

interface Preview {
  file: File;
  url: string;
}

export default function EventImagesUploader({
  files,
  onChange,
  disabled,
  maxImages = 6,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previews: Preview[] = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [previews]);

  function handlePick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (incoming.length === 0) return;

    const next: File[] = [...files];
    let lastError: string | null = null;
    for (const file of incoming) {
      if (next.length >= maxImages) {
        lastError = `You can upload up to ${maxImages} photos.`;
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
    onChange(next);
  }

  function handleRemove(index: number) {
    if (disabled) return;
    const next = files.filter((_, i) => i !== index);
    onChange(next);
    setError(null);
  }

  function move(index: number, direction: -1 | 1) {
    if (disabled) return;
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setError(null);
  }

  function makeCover(index: number) {
    if (disabled || index === 0) return;
    const next = [...files];
    const [promoted] = next.splice(index, 1);
    onChange([promoted, ...next]);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-lato text-xs text-[#475569]">
          The first image is the cover. Drag the buttons to reorder or promote.
        </p>
        <span className="rounded-full bg-[#edf3ff] px-3 py-1 font-lato text-xs font-bold text-secondary tabular-nums">
          {files.length}/{maxImages}
        </span>
      </div>

      {files.length === 0 ? (
        <button
          type="button"
          onClick={handlePick}
          disabled={disabled}
          className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] text-center transition-colors hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <PhotoIcon className="h-5 w-5" />
          </span>
          <span className="font-lato text-sm font-bold text-secondary">
            Upload photos
          </span>
          <span className="font-lato text-xs text-[#6b7a90]">
            JPG, PNG, or WEBP · max 5 MB · first image becomes the cover
          </span>
        </button>
      ) : (
        <ul className="flex flex-col gap-3">
          {previews.map((preview, index) => {
            const isCover = index === 0;
            return (
              <li
                key={preview.url}
                className={`flex items-center gap-3 rounded-2xl border p-2 transition-colors ${
                  isCover
                    ? "border-secondary/40 bg-[#f6faff]"
                    : "border-container-border bg-white"
                }`}
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary/10">
                  <img
                    src={preview.url}
                    alt={`Image ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isCover ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-lato text-[0.65rem] font-bold uppercase tracking-[0.16em] text-secondary">
                        <StarIcon className="h-3 w-3" />
                        Cover
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#edf3ff] px-2 py-0.5 font-lato text-[0.65rem] font-bold uppercase tracking-[0.16em] text-secondary">
                        Photo {index + 1}
                      </span>
                    )}
                    <span className="truncate font-lato text-xs text-[#475569] [overflow-wrap:anywhere]">
                      {preview.file.name}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={disabled || index === 0}
                      aria-label="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-container-border bg-white text-secondary transition-colors hover:bg-[#edf3ff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={disabled || index === files.length - 1}
                      aria-label="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-container-border bg-white text-secondary transition-colors hover:bg-[#edf3ff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDownIcon className="h-3.5 w-3.5" />
                    </button>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => makeCover(index)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1 rounded-lg border border-container-border bg-white px-2 py-1 font-lato text-[0.65rem] font-bold uppercase tracking-[0.16em] text-secondary transition-colors hover:bg-[#edf3ff] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <StarIcon className="h-3 w-3" />
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                      aria-label="Remove image"
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff1f2] text-[#be123c] transition-colors hover:bg-[#ffe4e6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {files.length > 0 && files.length < maxImages && (
        <button
          type="button"
          onClick={handlePick}
          disabled={disabled}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] px-4 py-3 font-lato text-sm font-bold text-secondary transition-colors hover:border-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          Add more photos
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {error && (
        <p className="font-lato text-xs text-[#be123c]">{error}</p>
      )}
    </div>
  );
}
