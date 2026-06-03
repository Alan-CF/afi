import { useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
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
};

type RoleFilter = 'all' | 'admin' | 'user';
type SortKey = 'fanaticCoins' | 'eCoins' | 'streak' | 'lastLogin' | 'username';
type SortDir = 'asc' | 'desc';

const ROLE_OPTIONS: readonly { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'user', label: 'Users' },
];

const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'fanaticCoins', label: 'Coins' },
  { key: 'eCoins', label: 'E-coins' },
  { key: 'streak', label: 'Streak' },
  { key: 'lastLogin', label: 'Login' },
  { key: 'username', label: 'Name' },
];

const HEAD =
  'px-3 py-2.5 font-lato text-xs font-bold uppercase tracking-wider text-text-light';
const HEAD_RIGHT = `${HEAD} text-right`;
const CELL_RIGHT =
  'px-3 py-2.5 text-right font-lato text-sm tabular-nums text-text';

function numericValue(row: AdminUserRow, key: SortKey): number {
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

export default function AdminUsersTable({ rows }: AdminUsersTableProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fanaticCoins');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => roleFilter === 'all' || row.role === roleFilter)
      .filter((row) =>
        query ? row.username.toLowerCase().includes(query) : true
      )
      .slice()
      .sort((a, b) => compareUsers(a, b, sortKey, sortDir));
  }, [rows, roleFilter, search, sortKey, sortDir]);

  return (
    <div>
      <AdminTableToolbar>
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search username…"
          className="sm:w-56"
        />
        <AdminSegmentedControl
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
          size="sm"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <AdminSegmentedControl
            options={SORT_OPTIONS}
            value={sortKey}
            onChange={setSortKey}
            size="sm"
          />
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
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-secondary/20 [&::-webkit-scrollbar]:h-2">
            <table className="min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-container-border bg-text-light-soft/60">
                  <th className={HEAD}>User</th>
                  <th className={HEAD}>Status</th>
                  <th className={HEAD}>Role</th>
                  <th className={HEAD_RIGHT}>Fanatic coins</th>
                  <th className={HEAD_RIGHT}>e-Coins</th>
                  <th className={HEAD_RIGHT}>Streak</th>
                  <th className={HEAD}>Last login</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-container-border transition-colors last:border-0 hover:bg-secondary/5"
                  >
                    <td className="px-3 py-2.5 font-lato text-sm font-semibold text-secondary">
                      {row.username}
                    </td>
                    <td className="px-3 py-2.5">
                      <AdminBadge variant={row.active ? 'blue' : 'muted'}>
                        {row.active ? 'Active' : 'Idle'}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2.5">
                      <AdminBadge
                        variant={row.role === 'admin' ? 'gold' : 'muted'}
                      >
                        {row.role}
                      </AdminBadge>
                    </td>
                    <td className={CELL_RIGHT}>
                      {formatNumber(row.fanaticCoins)}
                    </td>
                    <td className={CELL_RIGHT}>{formatNumber(row.eCoins)}</td>
                    <td className={CELL_RIGHT}>{formatNumber(row.streak)}</td>
                    <td className="px-3 py-2.5 font-lato text-sm text-text-light">
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
      )}
    </div>
  );
}
