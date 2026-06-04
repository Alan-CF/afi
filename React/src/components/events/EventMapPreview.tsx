import { useEffect, useState } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";

interface Props {
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  label?: string | null;
  height?: string;
  rounded?: string;
}

const BBOX_DELTA = 0.008;

function buildOsmSrc(lat: number, lng: number): string {
  const left = lng - BBOX_DELTA;
  const right = lng + BBOX_DELTA;
  const top = lat + BBOX_DELTA;
  const bottom = lat - BBOX_DELTA;
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function buildOsmDirectionsUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

async function geocodeQuery(
  query: string,
  signal: AbortSignal
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data || data.length === 0) return null;
    const lat = Number.parseFloat(data[0].lat);
    const lng = Number.parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export default function EventMapPreview({
  lat,
  lng,
  query,
  label,
  height = "h-40 md:h-52",
  rounded = "rounded-2xl",
}: Props) {
  const [resolved, setResolved] = useState<{ lat: number; lng: number } | null>(
    typeof lat === "number" && typeof lng === "number"
      ? { lat, lng }
      : null
  );
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      setResolved({ lat, lng });
      return;
    }
    if (!query || !query.trim()) {
      setResolved(null);
      return;
    }
    const controller = new AbortController();
    setResolving(true);
    geocodeQuery(query.trim(), controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setResolved(result);
      })
      .finally(() => {
        if (!controller.signal.aborted) setResolving(false);
      });
    return () => controller.abort();
  }, [lat, lng, query]);

  if (!resolved) {
    return (
      <div
        className={`flex w-full items-center justify-center border border-container-border bg-[#f6f8fc] font-lato text-sm font-bold text-[#475569] ${height} ${rounded}`}
      >
        {resolving ? "Locating map..." : "Location not set"}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-container-border bg-white ${height} ${rounded}`}
    >
      <iframe
        src={buildOsmSrc(resolved.lat, resolved.lng)}
        title={label ?? "Event location map"}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={buildOsmDirectionsUrl(resolved.lat, resolved.lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-container-border bg-white px-3 py-1.5 font-lato text-[0.7rem] font-bold text-secondary shadow-[0_4px_12px_rgba(15,23,42,0.1)] transition-colors hover:bg-[#edf3ff]"
      >
        Open map
        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
      </a>
    </div>
  );
}
