import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

type Position = {
  top: number;
  left: number;
  width: number;
};

type AdminDropdownProps = {
  label: string;
  className?: string;
  children: (close: () => void) => ReactNode;
};

export default function AdminDropdown({
  label,
  className,
  children,
}: AdminDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  const toggle = () => {
    setOpen((value) => {
      const next = !value;
      if (next) {
        place();
      }
      return next;
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  return (
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border-2 border-secondary bg-white px-3 font-lato text-xs font-bold text-secondary focus:outline-none"
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && position && (
        <div
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            minWidth: Math.max(position.width, 176),
          }}
          className="z-50 overflow-hidden rounded-xl border-2 border-container-border bg-white py-1 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

type AdminDropdownOptionProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

export function AdminDropdownOption({
  active,
  label,
  onClick,
}: AdminDropdownOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 font-lato text-xs font-bold text-secondary transition-colors hover:bg-secondary/5"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
          active
            ? 'border-secondary bg-secondary text-white'
            : 'border-container-border bg-white'
        }`}
      >
        {active && <CheckIcon className="h-3 w-3" />}
      </span>
      {label}
    </button>
  );
}
