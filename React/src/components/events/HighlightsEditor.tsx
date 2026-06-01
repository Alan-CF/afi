import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Props {
  highlights: string[];
  onChange: (next: string[]) => void;
  max?: number;
  disabled?: boolean;
}

const PLACEHOLDERS: string[] = [
  "Big screens and outdoor seating",
  "Free stickers for the first 50 fans",
  "Bring your Warriors jersey",
  "Halftime giveaway",
  "Postgame DJ if the Dubs win",
];

export default function HighlightsEditor({
  highlights,
  onChange,
  max = 5,
  disabled,
}: Props) {
  function update(index: number, value: string) {
    if (disabled) return;
    const next = [...highlights];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    if (disabled) return;
    onChange(highlights.filter((_, i) => i !== index));
  }

  function add() {
    if (disabled || highlights.length >= max) return;
    onChange([...highlights, ""]);
  }

  return (
    <div className="flex flex-col gap-3">
      {highlights.length === 0 ? (
        <p className="font-lato text-xs text-text-light">
          Highlights show as a clean checklist on the event page. Add a few short bullets.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {highlights.map((line, index) => (
            <li
              key={index}
              className="flex items-center gap-2 rounded-2xl border border-container-border bg-white px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 font-anton text-xs text-secondary">
                {index + 1}
              </span>
              <input
                type="text"
                value={line}
                onChange={(event) => update(index, event.target.value)}
                placeholder={PLACEHOLDERS[index % PLACEHOLDERS.length]}
                disabled={disabled}
                maxLength={120}
                className="w-full bg-transparent font-lato text-sm text-[#24344f] placeholder:text-[#94a3b8] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove highlight"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff1f2] text-[#be123c] transition-colors hover:bg-[#ffe4e6]"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        disabled={disabled || highlights.length >= max}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c9d6ea] bg-[#fbfdff] px-4 py-2 font-lato text-xs font-bold uppercase tracking-[0.08em] text-secondary transition-colors hover:border-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add highlight {highlights.length}/{max}
      </button>
    </div>
  );
}
