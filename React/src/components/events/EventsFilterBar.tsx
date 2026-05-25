import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

export type FanEventsSortMode = "upcoming" | "popular" | "recent";

export interface SortOption {
  value: FanEventsSortMode;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "popular", label: "Most going" },
  { value: "recent", label: "Recent" },
];

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  sort: FanEventsSortMode;
  onSortChange: (mode: FanEventsSortMode) => void;
}

export default function EventsFilterBar({
  query,
  onQueryChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-container-border bg-white p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
      <label className="flex flex-1 items-center gap-2 rounded-xl bg-[#f6f8fc] px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-secondary/70" />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search events"
          className="w-full min-w-0 bg-transparent font-lato text-sm text-[#1f3668] placeholder:text-[#64748b] focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="text-[#64748b] hover:text-secondary"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </label>

      <select
        value={sort}
        onChange={(event) =>
          onSortChange(event.target.value as FanEventsSortMode)
        }
        aria-label="Sort fan events"
        className="shrink-0 rounded-xl bg-[#f6f8fc] px-2.5 py-2 font-lato text-sm font-bold text-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
