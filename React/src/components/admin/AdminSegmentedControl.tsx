type AdminSegmentedOption<T extends string> = {
  key: T;
  label: string;
};

type AdminSegmentedControlProps<T extends string> = {
  options: readonly AdminSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
};

export default function AdminSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: AdminSegmentedControlProps<T>) {
  const pad =
    size === 'sm' ? 'px-2.5 py-1.5 text-[0.7rem]' : 'px-3 py-2 text-xs';

  return (
    <div
      className={`inline-flex max-w-full overflow-x-auto rounded-xl border-2 border-secondary scrollbar-hide ${className ?? ''}`}
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`${pad} whitespace-nowrap font-lato font-bold uppercase tracking-wider transition-colors ${
            value === option.key
              ? 'bg-secondary text-white'
              : 'bg-white text-secondary hover:bg-secondary/10'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
