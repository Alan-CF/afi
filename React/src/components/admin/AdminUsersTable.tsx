import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';
import {
  formatDate,
  formatNumber,
  type AdminUserRow,
} from '../../lib/adminDashboardApi';
import AdminBadge from './AdminBadge';
import AdminSearchInput from './AdminSearchInput';
import AdminSegmentedControl from './AdminSegmentedControl';
import AdminTableToolbar from './AdminTableToolbar';
import EmptyState from '../common/EmptyState';

type AdminUsersTableProps = {
  rows: AdminUserRow[];
  onlineUserIds: Set<string>;
};

type RoleFilter = 'all' | 'admin' | 'user';
type SortKey =
  | 'plays'
  | 'fanaticCoins'
  | 'eCoins'
  | 'streak'
  | 'lastLogin'
  | 'username';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

const ROLE_OPTIONS: readonly { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'user', label: 'Users' },
];

const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'plays', label: 'Plays' },
  { key: 'fanaticCoins', label: 'Coins' },
  { key: 'eCoins', label: 'E-coins' },
  { key: 'streak', label: 'Streak' },
  { key: 'lastLogin', label: 'Login' },
  { key: 'username', label: 'Name' },
];

const HEAD =
  'whitespace-nowrap px-3 py-2.5 font-lato text-xs font-bold uppercase tracking-wider text-text-light';
const HEAD_RIGHT = `${HEAD} text-right`;
const CELL_RIGHT =
  'px-3 py-2.5 text-right font-lato text-sm tabular-nums text-text';

function numericValue(row: AdminUserRow, key: SortKey): number {
  if (key === 'plays') {
    return row.plays;
  }
  if (key === 'eCoins') {
    return row.eCoins;
  }
  if (key === 'streak') {
    return row.streak;
  }
  return row.fanaticCoins;
}

function compareUsers(
  a: AdminUserRow,
  b: AdminUserRow,
  key: SortKey,
  dir: SortDir
): number {
  let result = 0;
  if (key === 'username') {
    result = a.username.localeCompare(b.username);
  } else if (key === 'lastLogin') {
    result = (a.lastLogin ?? '').localeCompare(b.lastLogin ?? '');
  } else {
    result = numericValue(a, key) - numericValue(b, key);
  }
  return dir === 'asc' ? result : -result;
}

function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  return (
    <AdminBadge variant={role === 'admin' ? 'gold' : 'muted'}>{role}</AdminBadge>
  );
}

function StatusBadge({ live }: { live: boolean }) {
  return (
    <AdminBadge variant={live ? 'blue' : 'muted'}>
      {live ? 'Live' : 'Offline'}
    </AdminBadge>
  );
}

export default function AdminUsersTable({
  rows,
  onlineUserIds,
}: AdminUsersTableProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('plays');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => roleFilter === 'all' || row.role === roleFilter)
      .filter((row) => {
        if (!query) {
          return true;
        }
        return (
          row.username.toLowerCase().includes(query) ||
          (row.fullName?.toLowerCase().includes(query) ?? false)
        );
      })
      .slice()
      .sort((a, b) => compareUsers(a, b, sortKey, sortDir));
  }, [rows, roleFilter, search, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div>
      <AdminTableToolbar>
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search username or name…"
          className="w-full sm:min-w-[260px] sm:flex-1"
        />
        <AdminSegmentedControl
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
          size="sm"
          block
          className="w-full sm:w-auto"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
            Sort by
          </span>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="h-9 flex-1 rounded-xl border-2 border-secondary bg-white px-3 font-lato text-xs font-bold text-secondary focus:outline-none sm:flex-none"
            aria-label="Sort users by"
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

      {filtered.length === 0 ? (
        <EmptyState message="No users match your filters." variant="compact" />
      ) : (
        <>
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-secondary/20 [&::-webkit-scrollbar]:h-2">
              <table className="min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-container-border">
                    <th className={HEAD}>Username</th>
                    <th className={HEAD}>Name</th>
                    <th className={HEAD}>Status</th>
                    <th className={HEAD}>Role</th>
                    <th className={HEAD_RIGHT}>Plays</th>
                    <th className={HEAD_RIGHT}>Coins</th>
                    <th className={HEAD_RIGHT}>E-coins</th>
                    <th className={HEAD_RIGHT}>Streak</th>
                    <th className={HEAD}>Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-container-border transition-colors last:border-0 hover:bg-secondary/5"
                    >
                      <td className="px-3 py-3 font-lato text-sm font-semibold text-secondary">
                        {row.username}
                      </td>
                      <td className="px-3 py-3 font-lato text-sm text-text">
                        {row.fullName ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge live={onlineUserIds.has(row.id)} />
                      </td>
                      <td className="px-3 py-3">
                        <RoleBadge role={row.role} />
                      </td>
                      <td className={CELL_RIGHT}>{formatNumber(row.plays)}</td>
                      <td className={CELL_RIGHT}>
                        {formatNumber(row.fanaticCoins)}
                      </td>
                      <td className={CELL_RIGHT}>{formatNumber(row.eCoins)}</td>
                      <td className={CELL_RIGHT}>{formatNumber(row.streak)}</td>
                      <td className="px-3 py-3 font-lato text-sm text-text-light">
                        {formatDate(row.lastLogin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 font-lato text-[0.7rem] text-text-light sm:hidden">
              Swipe horizontally to see more →
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-xl border-2 border-secondary px-3 py-1.5 font-lato text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-secondary"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Prev
            </button>
            <span className="font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-xl border-2 border-secondary px-3 py-1.5 font-lato text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-secondary"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
