type AdminSegmentedOption<T extends string> = {
  key: T;
  label: string;
};

type AdminSegmentedControlProps<T extends string> = {
  options: readonly AdminSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  block?: boolean;
  className?: string;
};

export default function AdminSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  block = false,
  className,
}: AdminSegmentedControlProps<T>) {
  const pad = size === 'sm' ? 'px-3 text-[0.7rem]' : 'px-4 text-xs';
  const height = size === 'sm' ? 'h-9' : 'h-10';

  return (
    <div
      className={`${height} max-w-full overflow-x-auto rounded-xl border-2 border-secondary scrollbar-hide ${
        block ? 'flex' : 'inline-flex'
      } ${className ?? ''}`}
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`${pad} flex items-center justify-center whitespace-nowrap font-lato font-bold uppercase tracking-wider transition-colors ${
            block ? 'flex-1 text-center' : ''
          } ${
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
