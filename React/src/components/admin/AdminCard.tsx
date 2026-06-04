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
      className={`max-w-full overflow-hidden rounded-3xl border border-container-border bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] md:p-6 ${className ?? ''}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="h-1 w-10 rounded-full bg-primary" />
          <h2 className="mt-2 font-anton text-xl leading-tight text-secondary md:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 font-lato text-xs font-bold text-[#475569] md:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
