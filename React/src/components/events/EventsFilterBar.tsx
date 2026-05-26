import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

export type FanEventsSortMode = "upcoming" | "newest" | "popular" | "alpha";

export interface SortOption {
  value: FanEventsSortMode;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most attended" },
  { value: "alpha", label: "A-Z" },
];

export type EventsView = "all" | "mine" | "attending";

export interface ViewOption {
  value: EventsView;
  label: string;
}

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  sort: FanEventsSortMode;
  onSortChange: (mode: FanEventsSortMode) => void;
  view?: EventsView;
  onViewChange?: (view: EventsView) => void;
  viewOptions?: ViewOption[];
}

export default function EventsFilterBar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  viewOptions,
}: Props) {
  const showViewSelect =
    !!viewOptions &&
    viewOptions.length > 1 &&
    view !== undefined &&
    !!onViewChange;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-container-border bg-white p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center">
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

      <div className="flex shrink-0 items-center gap-2">
        {showViewSelect && (
          <select
            value={view}
            onChange={(event) =>
              onViewChange!(event.target.value as EventsView)
            }
            aria-label="Filter events"
            className="rounded-xl bg-[#f6f8fc] px-2.5 py-2 font-lato text-sm font-bold text-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {viewOptions!.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as FanEventsSortMode)
          }
          aria-label="Sort events"
          className="rounded-xl bg-[#f6f8fc] px-2.5 py-2 font-lato text-sm font-bold text-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
