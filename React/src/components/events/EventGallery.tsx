import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

interface Props {
  images: string[];
  alt: string;
}

export default function EventGallery({ images, alt }: Props) {
  const cleaned = useMemo(
    () => images.filter((url) => typeof url === "string" && url.length > 0),
    [images]
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex == null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) => {
          if (current == null) return current;
          return current + 1 >= cleaned.length ? 0 : current + 1;
        });
        return;
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => {
          if (current == null) return current;
          return current - 1 < 0 ? cleaned.length - 1 : current - 1;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, cleaned.length]);

  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return null;

  const extras = cleaned.slice(1);

  return (
    <section className="rounded-3xl border border-container-border bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-anton text-xl text-secondary">Gallery</h2>
        <span className="font-lato text-xs text-[#475569] tabular-nums">
          {cleaned.length} photos
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {extras.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setLightboxIndex(index + 1)}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-secondary/10"
          >
            <img
              src={url}
              alt={`${alt} ${index + 2}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display =
                  "none";
              }}
            />
          </button>
        ))}
      </div>

      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {cleaned.length > 1 && (
            <button
              type="button"
              aria-label="Previous"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex((current) => {
                  if (current == null) return current;
                  return current - 1 < 0 ? cleaned.length - 1 : current - 1;
                });
              }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}

          <img
            src={cleaned[lightboxIndex]}
            alt={`${alt} ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {cleaned.length > 1 && (
            <button
              type="button"
              aria-label="Next"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex((current) => {
                  if (current == null) return current;
                  return current + 1 >= cleaned.length ? 0 : current + 1;
                });
              }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
