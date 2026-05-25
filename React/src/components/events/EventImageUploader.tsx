import { useEffect, useRef, useState } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { validateEventImageFile } from "../../lib/eventsApi";

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export default function EventImageUploader({ file, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function handlePickClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!next) return;
    const validation = validateEventImageFile(next);
    if (validation) {
      setLocalError(validation);
      return;
    }
    setLocalError(null);
    onChange(next);
  }

  function handleClear() {
    if (disabled) return;
    setLocalError(null);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePickClick}
        disabled={disabled}
        className={`relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] transition-colors hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:cursor-not-allowed disabled:opacity-60 ${
          previewUrl ? "border-solid border-secondary/40" : ""
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Event preview"
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

        {previewUrl && !disabled && (
          <span
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleClear();
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-secondary shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
            role="button"
            aria-label="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {localError && (
        <p className="font-lato text-xs text-[#be123c]">{localError}</p>
      )}
    </div>
  );
}
