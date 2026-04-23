import type { EventType } from "../../hooks/events";

export interface EventsFilterState {
  types: EventType[];
}

interface Props {
  value: EventsFilterState;
  onChange: (next: EventsFilterState) => void;
}

const ALL_TYPES: Array<{ key: EventType; label: string }> = [
  { key: "game", label: "Games" },
  { key: "fan",  label: "Fan events" },
];

export default function EventsFilters({ value, onChange }: Props) {
  function toggleType(type: EventType) {
    const next = value.types.includes(type)
      ? value.types.filter((t) => t !== type)
      : [...value.types, type];
    if (next.length === 0) return;
    onChange({ ...value, types: next });
  }

  return (
    <div
      role="group"
      aria-label="Filter events by type"
      className="flex flex-wrap gap-2 rounded-2xl border-2 border-gray-100 bg-white p-3"
    >
      <span className="flex items-center font-lato text-xs uppercase tracking-[0.16em] text-text-light">
        Filter:
      </span>
      {ALL_TYPES.map((t) => {
        const active = value.types.includes(t.key);
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={active}
            onClick={() => toggleType(t.key)}
            className={`rounded-full border-2 px-3 py-1 font-lato text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
              active
                ? "border-secondary bg-secondary text-white"
                : "border-gray-200 bg-white text-secondary hover:border-secondary"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
