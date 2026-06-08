import { type DateRange } from '../../lib/adminDashboardApi';

type AdminDateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (range: DateRange) => void;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DATE_INPUT =
  'min-w-0 flex-1 rounded-lg border border-container-border bg-white px-2 py-1.5 font-lato text-xs font-semibold text-secondary focus:border-secondary focus:outline-none sm:flex-none';

export function friendlyRange(startDate: string, endDate: string): string {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  if (!sy || !ey) {
    return `${startDate} – ${endDate}`;
  }
  const startLabel = `${MONTHS[sm - 1] ?? sm} ${sd}`;
  const endLabel = `${MONTHS[em - 1] ?? em} ${ed}`;
  if (sy === ey) {
    return `${startLabel} – ${endLabel}, ${ey}`;
  }
  return `${startLabel}, ${sy} – ${endLabel}, ${ey}`;
}

export default function AdminDateRangeFilter({
  startDate,
  endDate,
  onRangeChange,
}: AdminDateRangeFilterProps) {
  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-container-border bg-white px-3 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:w-auto">
      <input
        type="date"
        value={startDate}
        max={endDate}
        onChange={(event) =>
          onRangeChange({ startDate: event.target.value, endDate })
        }
        className={DATE_INPUT}
        aria-label="Start date"
      />
      <span className="shrink-0 font-lato text-xs text-text-light">→</span>
      <input
        type="date"
        value={endDate}
        min={startDate}
        onChange={(event) =>
          onRangeChange({ startDate, endDate: event.target.value })
        }
        className={DATE_INPUT}
        aria-label="End date"
      />
    </div>
  );
}
