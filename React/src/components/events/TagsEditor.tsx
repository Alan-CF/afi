import { useMemo, useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";

export const TAG_PRESETS: string[] = [
  "Watch Party",
  "Pickup",
  "Meetup",
  "Charity",
  "Family Friendly",
  "Outdoor",
  "Free",
  "21+",
  "Food",
  "Music",
  "Game Day",
  "Dub Nation",
];

interface Props {
  tags: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  max?: number;
  presets?: string[];
}

function normalize(tag: string): string {
  return tag.trim();
}

function lower(tag: string): string {
  return normalize(tag).toLowerCase();
}

export default function TagsEditor({
  tags,
  onChange,
  disabled,
  max = 10,
  presets = TAG_PRESETS,
}: Props) {
  const [draft, setDraft] = useState("");
  const selectedLower = useMemo(
    () => new Set(tags.map((tag) => lower(tag))),
    [tags]
  );

  function toggle(tag: string) {
    if (disabled) return;
    const key = lower(tag);
    const next = selectedLower.has(key)
      ? tags.filter((existing) => lower(existing) !== key)
      : tags.length >= max
      ? tags
      : [...tags, normalize(tag)];
    onChange(next);
  }

  function addCustom() {
    if (disabled) return;
    const value = normalize(draft);
    if (!value) return;
    if (selectedLower.has(lower(value))) {
      setDraft("");
      return;
    }
    if (tags.length >= max) return;
    onChange([...tags, value]);
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustom();
    }
  }

  const customSelected = tags.filter(
    (tag) => !presets.some((preset) => lower(preset) === lower(tag))
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = selectedLower.has(lower(preset));
          return (
            <button
              key={preset}
              type="button"
              onClick={() => toggle(preset)}
              disabled={disabled || (!active && tags.length >= max)}
              aria-pressed={active}
              className={`rounded-full border-2 px-3 py-1 font-lato text-xs font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-secondary bg-secondary text-white"
                  : "border-[#c9d6ea] bg-white text-secondary hover:border-secondary"
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSelected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-lato text-xs font-bold text-secondary"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(tag)}
                  aria-label={`Remove ${tag}`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-secondary/70 hover:text-secondary"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom tag (e.g., Bay Area)"
          disabled={disabled || tags.length >= max}
          className="flex-1 rounded-2xl border-2 border-[#c9d6ea] bg-white px-4 py-2 font-lato text-sm text-[#24344f] placeholder:text-[#94a3b8] focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={disabled || !draft.trim() || tags.length >= max}
          className="inline-flex items-center gap-1 rounded-2xl border-2 border-secondary px-3 py-2 font-lato text-xs font-bold uppercase tracking-[0.08em] text-secondary transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <p className="font-lato text-[0.7rem] text-text-light tabular-nums">
        {tags.length}/{max} tags
      </p>
    </div>
  );
}
