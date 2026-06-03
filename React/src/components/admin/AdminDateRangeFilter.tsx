import {
  presetToRange,
  type ActiveUsersGranularity,
  type DatePreset,
  type DateRange,
} from '../../lib/adminDashboardApi';
import AdminSegmentedControl from './AdminSegmentedControl';

type AdminDateRangeFilterProps = {
  startDate: string;
  endDate: string;
  granularity: ActiveUsersGranularity;
  onRangeChange: (range: DateRange) => void;
  onGranularityChange: (granularity: ActiveUsersGranularity) => void;
};

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
];

const GRANULARITY_OPTIONS: readonly { key: ActiveUsersGranularity; label: string }[] =
  [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

const INPUT_CLASS =
  'w-full rounded-xl border-2 border-container-border bg-white px-3 py-2 font-lato text-sm text-text transition-colors focus:border-secondary focus:outline-none';

export default function AdminDateRangeFilter({
  startDate,
  endDate,
  granularity,
  onRangeChange,
  onGranularityChange,
}: AdminDateRangeFilterProps) {
  const activePreset =
    PRESETS.find((preset) => {
      const range = presetToRange(preset.key);
      return range.startDate === startDate && range.endDate === endDate;
    })?.key ?? null;

  return (
    <div className="rounded-2xl border border-container-border bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onRangeChange(presetToRange(preset.key))}
                className={`rounded-full border-2 px-3 py-1.5 font-lato text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'border-secondary bg-secondary text-white'
                    : 'border-secondary text-secondary hover:bg-secondary hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label className="flex w-full flex-col gap-1 sm:w-44">
            <span className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) =>
                onRangeChange({ startDate: event.target.value, endDate })
              }
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex w-full flex-col gap-1 sm:w-44">
            <span className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              End date
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) =>
                onRangeChange({ startDate, endDate: event.target.value })
              }
              className={INPUT_CLASS}
            />
          </label>

          <div className="flex flex-col gap-1 md:ml-auto">
            <span className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Granularity
            </span>
            <AdminSegmentedControl
              options={GRANULARITY_OPTIONS}
              value={granularity}
              onChange={onGranularityChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
