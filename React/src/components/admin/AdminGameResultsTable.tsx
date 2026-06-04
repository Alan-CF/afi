import { useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import {
  formatDate,
  formatDecimal,
  formatNumber,
  type GameResultRow,
} from '../../lib/adminDashboardApi';
import AdminTableToolbar from './AdminTableToolbar';

type AdminGameResultsTableProps = {
  rows: GameResultRow[];
};

type SortKey =
  | 'plays'
  | 'uniquePlayers'
  | 'avgPlaysPerUser'
  | 'coinsAwarded'
  | 'lastPlayed';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'plays', label: 'Plays' },
  { key: 'uniquePlayers', label: 'Players' },
  { key: 'avgPlaysPerUser', label: 'Avg/user' },
  { key: 'coinsAwarded', label: 'Coins' },
  { key: 'lastPlayed', label: 'Last played' },
];

const HEAD =
  'whitespace-nowrap px-3 py-2.5 font-lato text-xs font-bold uppercase tracking-wider text-text-light';
const HEAD_RIGHT = `${HEAD} text-right`;
const CELL_RIGHT =
  'px-3 py-2.5 text-right font-lato text-sm tabular-nums text-text';

function sortValue(row: GameResultRow, key: SortKey): number {
  if (key === 'coinsAwarded') {
    return row.coinsAwarded ?? -1;
  }
  if (key === 'lastPlayed') {
    return row.lastPlayed ? new Date(row.lastPlayed).getTime() : -1;
  }
  return row[key];
}

export default function AdminGameResultsTable({
  rows,
}: AdminGameResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('plays');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) =>
        sortDir === 'asc'
          ? sortValue(a, sortKey) - sortValue(b, sortKey)
          : sortValue(b, sortKey) - sortValue(a, sortKey)
      );
  }, [rows, sortKey, sortDir]);

  return (
    <div>
      <AdminTableToolbar>
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-lato text-xs font-bold uppercase tracking-wider text-text-light">
            Sort by
          </span>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="h-9 flex-1 rounded-xl border-2 border-secondary bg-white px-3 font-lato text-xs font-bold text-secondary focus:outline-none sm:flex-none"
            aria-label="Sort games by"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-secondary text-secondary transition-colors hover:bg-secondary hover:text-white"
            aria-label={
              sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'
            }
          >
            {sortDir === 'asc' ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </AdminTableToolbar>

      <div className="w-full overflow-hidden">
        <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-secondary/20 [&::-webkit-scrollbar]:h-2">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-container-border">
                <th className={HEAD}>Game</th>
                <th className={HEAD_RIGHT}>Plays</th>
                <th className={HEAD_RIGHT}>Unique players</th>
                <th className={HEAD_RIGHT}>Avg plays/user</th>
                <th className={HEAD_RIGHT}>Coins awarded</th>
                <th className={HEAD_RIGHT}>Last played</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-container-border transition-colors last:border-0 hover:bg-secondary/5"
                >
                  <td className="px-3 py-3 font-lato text-sm font-semibold text-secondary">
                    {row.label}
                  </td>
                  <td className={CELL_RIGHT}>{formatNumber(row.plays)}</td>
                  <td className={CELL_RIGHT}>
                    {formatNumber(row.uniquePlayers)}
                  </td>
                  <td className={CELL_RIGHT}>
                    {formatDecimal(row.avgPlaysPerUser)}
                  </td>
                  <td className={CELL_RIGHT}>
                    {row.coinsAwarded === null
                      ? '—'
                      : formatNumber(row.coinsAwarded)}
                  </td>
                  <td className={CELL_RIGHT}>{formatDate(row.lastPlayed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-lato text-[0.7rem] text-text-light sm:hidden">
          Swipe horizontally to see more →
        </p>
      </div>
    </div>
  );
}
