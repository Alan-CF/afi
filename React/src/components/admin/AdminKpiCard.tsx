type AdminKpiAccent = 'gold' | 'blue' | 'green' | 'red';

type AdminKpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: AdminKpiAccent;
};

const ACCENT_BARS: Record<AdminKpiAccent, string> = {
  gold: 'bg-primary',
  blue: 'bg-secondary',
  green: 'bg-success',
  red: 'bg-destructive',
};

export default function AdminKpiCard({
  label,
  value,
  hint,
  accent = 'blue',
}: AdminKpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-container-border bg-white p-4 shadow-sm">
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${ACCENT_BARS[accent]}`}
        aria-hidden="true"
      />
      <p className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
        {label}
      </p>
      <p className="mt-2 font-anton text-2xl text-secondary md:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 font-lato text-xs text-text-light">{hint}</p>}
    </div>
  );
}
