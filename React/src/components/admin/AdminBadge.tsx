import type { ReactNode } from 'react';

type AdminBadgeVariant = 'gold' | 'blue' | 'outline' | 'muted' | 'light';

type AdminBadgeProps = {
  children: ReactNode;
  variant?: AdminBadgeVariant;
  className?: string;
};

const VARIANTS: Record<AdminBadgeVariant, string> = {
  gold: 'bg-primary text-secondary',
  blue: 'bg-secondary text-white',
  outline: 'border border-secondary/30 text-secondary',
  muted: 'bg-text-light-soft text-text-light',
  light: 'bg-white/15 text-white',
};

export default function AdminBadge({
  children,
  variant = 'gold',
  className,
}: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-lato text-[0.7rem] font-bold uppercase tracking-wider ${VARIANTS[variant]} ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
