import type { ReactNode } from 'react';

type AdminKpiTone = 'blue' | 'gold';

type AdminKpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: AdminKpiTone;
  icon?: ReactNode;
};

const ICON_CHIP: Record<AdminKpiTone, string> = {
  blue: 'bg-secondary/10 text-secondary',
  gold: 'bg-primary/20 text-primary-dark',
};

export default function AdminKpiCard({
  label,
  value,
  hint,
  tone = 'blue',
  icon,
}: AdminKpiCardProps) {
  return (
    <div className="flex min-h-[116px] flex-col justify-between rounded-2xl border border-container-border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ICON_CHIP[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="font-anton text-2xl leading-none text-secondary md:text-3xl">
          {value}
        </p>
        {hint && (
          <p className="mt-1.5 font-lato text-xs text-text-light">{hint}</p>
        )}
      </div>
    </div>
  );
}
