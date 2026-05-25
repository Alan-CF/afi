import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import EventMapPreview from "./EventMapPreview";

export interface PickedLocation {
  displayName: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  postcode: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  address?: {
    name?: string;
    amenity?: string;
    leisure?: string;
    tourism?: string;
    shop?: string;
    building?: string;
    house_number?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
}

interface Props {
  value: PickedLocation | null;
  onChange: (next: PickedLocation | null) => void;
  disabled?: boolean;
}

function pickFirst(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function nominatimToPicked(result: NominatimResult): PickedLocation {
  const address = result.address ?? {};
  const lat = Number.parseFloat(result.lat);
  const lng = Number.parseFloat(result.lon);

  const venue = pickFirst(
    address.name,
    address.amenity,
    address.leisure,
    address.tourism,
    address.shop,
    address.building,
    result.name,
    result.display_name.split(",")[0]
  );

  const street = pickFirst(address.road, address.pedestrian);
  const streetWithNumber = address.house_number
    ? `${address.house_number} ${street}`.trim()
    : street;
  const fallbackAddress = pickFirst(
    streetWithNumber,
    address.neighbourhood,
    address.suburb,
    address.village
  );

  const city = pickFirst(
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county
  );
  const state = pickFirst(address.state, address.region, address.county);
  const country = pickFirst(address.country);
  const countryCode = pickFirst(address.country_code).toUpperCase();
  const postcode = pickFirst(address.postcode);

  return {
    displayName: result.display_name,
    venue: venue || result.display_name.split(",")[0]?.trim() || "Location",
    address: fallbackAddress || venue,
    city,
    state,
    country,
    countryCode,
    postcode,
    lat,
    lng,
  };
}

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Search failed.");
  return (await res.json()) as NominatimResult[];
}

async function reverseNominatim(
  lat: number,
  lng: number
): Promise<NominatimResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimResult;
  if (!data || !data.lat || !data.lon) return null;
  return data;
}

export default function LocationPicker({ value, onChange, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!openDropdown) return;
    function onClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
    }
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        setError(null);
        const list = await searchNominatim(trimmed);
        if (controller.signal.aborted) return;
        setResults(list);
        setOpenDropdown(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("LocationPicker search:", err);
        setError("Could not search locations.");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function handleSelect(result: NominatimResult) {
    const picked = nominatimToPicked(result);
    if (Number.isNaN(picked.lat) || Number.isNaN(picked.lng)) {
      setError("Selected location has no coordinates.");
      return;
    }
    onChange(picked);
    setQuery("");
    setResults([]);
    setOpenDropdown(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpenDropdown(false);
    setError(null);
  }

  function handleUseCurrentLocation() {
    if (disabled || locatingMe) return;
    if (!navigator.geolocation) {
      setError("Your browser does not support geolocation.");
      return;
    }
    setLocatingMe(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const result = await reverseNominatim(lat, lng);
          if (!result) {
            onChange({
              displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              venue: "Current location",
              address: "",
              city: "",
              state: "",
              country: "",
              countryCode: "",
              postcode: "",
              lat,
              lng,
            });
          } else {
            handleSelect(result);
          }
        } catch (err) {
          console.error("reverse geocode:", err);
          setError("Could not resolve your address.");
        } finally {
          setLocatingMe(false);
        }
      },
      (positionError) => {
        console.error("geolocation:", positionError);
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Location permission denied."
            : "Could not get your location."
        );
        setLocatingMe(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  return (
    <div className="flex flex-col gap-3" ref={wrapperRef}>
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border-2 border-[#c9d6ea] bg-white px-3 py-2 focus-within:border-primary">
          <MagnifyingGlassIcon className="h-4 w-4 text-secondary/60" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpenDropdown(true);
            }}
            placeholder="Search a venue, address, or city..."
            disabled={disabled}
            className="w-full bg-transparent py-1 font-lato text-sm text-[#24344f] placeholder:text-[#94a3b8] focus:outline-none sm:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#94a3b8] hover:text-secondary"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {openDropdown && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-container-border bg-white shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
            {results.map((result) => (
              <li key={`${result.lat}-${result.lon}-${result.display_name}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f3f7ff]"
                >
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span className="min-w-0 font-lato text-sm text-[#24344f]">
                    {result.display_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {openDropdown && !searching && query.trim().length >= 3 && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-container-border bg-white px-4 py-3 font-lato text-sm text-[#475569] shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
            No matches. Try a different search.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || locatingMe}
          className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-white px-3 py-1.5 font-lato text-xs font-bold text-secondary transition-colors hover:bg-[#edf3ff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MapPinIcon className="h-4 w-4" />
          {locatingMe ? "Locating..." : "Use my current location"}
        </button>
        {searching && (
          <span className="font-lato text-xs text-[#475569]">Searching...</span>
        )}
        {error && (
          <span className="font-lato text-xs text-[#be123c]">{error}</span>
        )}
      </div>

      {value && (
        <div className="flex flex-col gap-2 rounded-2xl border border-secondary/20 bg-[#f6faff] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-lato text-sm font-bold text-secondary">
                {value.venue}
              </p>
              <p className="mt-1 font-lato text-xs text-[#475569] [overflow-wrap:anywhere]">
                {[value.address, value.city, value.state, value.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 rounded-full bg-white px-3 py-1 font-lato text-xs font-bold text-secondary shadow-sm transition-colors hover:bg-[#edf3ff]"
              >
                Change
              </button>
            )}
          </div>
          <EventMapPreview
            lat={value.lat}
            lng={value.lng}
            label={value.venue}
            height="h-36 md:h-44"
            rounded="rounded-2xl"
          />
        </div>
      )}
    </div>
  );
}
