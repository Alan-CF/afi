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

function buildOsmQuerySrc(query: string): string {
  return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${encodeURIComponent(
    query
  )}`;
}

export default function EventMapPreview({
  lat,
  lng,
  query,
  label,
  height = "h-40 md:h-52",
  rounded = "rounded-2xl",
}: Props) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const src = hasCoords
    ? buildOsmSrc(lat as number, lng as number)
    : query
    ? buildOsmQuerySrc(query)
    : null;

  if (!src) {
    return (
      <div
        className={`flex w-full items-center justify-center bg-[#eef3fb] font-lato text-sm text-[#475569] ${height} ${rounded}`}
      >
        Location not set
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-container-border bg-white ${height} ${rounded}`}
    >
      <iframe
        src={src}
        title={label ?? "Event location map"}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {hasCoords && (
        <a
          href={buildOsmDirectionsUrl(lat as number, lng as number)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 font-lato text-[0.7rem] font-bold text-secondary shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition-colors hover:bg-white"
        >
          Open map
          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
