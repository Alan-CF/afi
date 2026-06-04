import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: AdminSearchInputProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border-2 border-container-border bg-white pl-9 pr-3 font-lato text-sm text-text transition-colors focus:border-secondary focus:outline-none"
      />
    </div>
  );
}
