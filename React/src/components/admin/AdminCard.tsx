import type { ReactNode } from 'react';

type AdminCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function AdminCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: AdminCardProps) {
  return (
    <section
      className={`max-w-full overflow-hidden rounded-2xl border border-container-border bg-white p-4 shadow-sm md:p-5 ${className ?? ''}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-1 h-5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-anton text-lg uppercase tracking-wide text-secondary md:text-xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 font-lato text-xs text-text-light md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
