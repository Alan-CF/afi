import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import {
  formatDate,
  formatNumber,
  type AdminUserRow,
} from '../../lib/adminDashboardApi';
import AdminBadge from './AdminBadge';
import AdminDropdown, { AdminDropdownOption } from './AdminDropdown';
import AdminSearchInput from './AdminSearchInput';
import EmptyState from '../common/EmptyState';

type AdminUsersTableProps = {
  rows: AdminUserRow[];
  onlineUserIds: Set<string>;
};

type FilterKey = 'admin' | 'user' | 'live' | 'offline';
type SortKey =
  | 'plays'
  | 'fanaticCoins'
  | 'eCoins'
  | 'streak'
  | 'lastLogin'
  | 'username';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

const FILTER_OPTIONS: readonly { key: FilterKey; label: string }[] = [
  { key: 'admin', label: 'Admins' },
  { key: 'user', label: 'Users' },
  { key: 'live', label: 'Live' },
  { key: 'offline', label: 'Offline' },
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
  const [filters, setFilters] = useState<Set<FilterKey>>(() => new Set());
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('plays');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const toggleFilter = (key: FilterKey) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  const filterKey = Array.from(filters).sort().join(',');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const roleActive = filters.has('admin') || filters.has('user');
    const statusActive = filters.has('live') || filters.has('offline');
    return rows
      .filter((row) => !roleActive || filters.has(row.role))
      .filter((row) => {
        if (!statusActive) {
          return true;
        }
        return onlineUserIds.has(row.id)
          ? filters.has('live')
          : filters.has('offline');
      })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filterKey, onlineUserIds, search, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [filterKey, search, sortKey, sortDir]);

  const sortLabel =
    SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? 'Plays';

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {!searchOpen && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-container-border text-secondary transition-colors hover:border-secondary sm:hidden"
            aria-label="Search users"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>
        )}
        <div
          className={`${
            searchOpen ? 'flex' : 'hidden'
          } w-56 shrink-0 items-center gap-1 sm:flex sm:w-auto sm:min-w-[240px] sm:flex-1`}
        >
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users…"
            className="w-full"
          />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSearchOpen(false);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-container-border text-secondary transition-colors hover:border-secondary sm:hidden"
            aria-label="Close search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <AdminDropdown
          label={filters.size === 0 ? 'Filter: All' : `Filter: ${filters.size}`}
          className="w-40 shrink-0 sm:w-44"
        >
          {() => (
            <>
              <AdminDropdownOption
                active={filters.size === 0}
                label="All"
                onClick={() => setFilters(new Set())}
              />
              {FILTER_OPTIONS.map((option) => (
                <AdminDropdownOption
                  key={option.key}
                  active={filters.has(option.key)}
                  label={option.label}
                  onClick={() => toggleFilter(option.key)}
                />
              ))}
            </>
          )}
        </AdminDropdown>
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <AdminDropdown
            label={`Sort: ${sortLabel}`}
            className="w-40 shrink-0 sm:w-44"
          >
            {(close) => (
              <>
                {SORT_OPTIONS.map((option) => (
                  <AdminDropdownOption
                    key={option.key}
                    active={option.key === sortKey}
                    label={option.label}
                    onClick={() => {
                      setSortKey(option.key);
                      close();
                    }}
                  />
                ))}
              </>
            )}
          </AdminDropdown>
          <button
            type="button"
            onClick={() =>
              setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-secondary text-secondary transition-colors hover:bg-secondary hover:text-white"
            aria-label={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
          >
            {sortDir === 'asc' ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No users match your filters." variant="compact" />
      ) : (
        <>
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-secondary/20 [&::-webkit-scrollbar]:h-2">
              <table className="w-full min-w-[900px] border-collapse text-left">
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
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-secondary text-secondary transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-secondary"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-secondary text-secondary transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-secondary"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
