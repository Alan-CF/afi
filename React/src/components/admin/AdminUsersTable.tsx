import {
  formatDate,
  formatNumber,
  type AdminUserRow,
} from '../../lib/adminDashboardApi';

type AdminUsersTableProps = {
  rows: AdminUserRow[];
};

function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  const isAdminRole = role === 'admin';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-lato text-xs font-bold uppercase tracking-wider ${
        isAdminRole
          ? 'bg-primary text-secondary'
          : 'bg-text-light-soft text-text-light'
      }`}
    >
      {role}
    </span>
  );
}

export default function AdminUsersTable({ rows }: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-container-border">
            <th className="px-3 py-2 font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              User
            </th>
            <th className="px-3 py-2 font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Role
            </th>
            <th className="px-3 py-2 text-right font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Fanatic coins
            </th>
            <th className="px-3 py-2 text-right font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              e-Coins
            </th>
            <th className="px-3 py-2 text-right font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Streak
            </th>
            <th className="px-3 py-2 font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              Last login
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-container-border last:border-0"
            >
              <td className="px-3 py-2 font-lato text-sm font-semibold text-secondary">
                {row.username}
              </td>
              <td className="px-3 py-2">
                <RoleBadge role={row.role} />
              </td>
              <td className="px-3 py-2 text-right font-lato text-sm tabular-nums text-text">
                {formatNumber(row.fanaticCoins)}
              </td>
              <td className="px-3 py-2 text-right font-lato text-sm tabular-nums text-text">
                {formatNumber(row.eCoins)}
              </td>
              <td className="px-3 py-2 text-right font-lato text-sm tabular-nums text-text">
                {formatNumber(row.streak)}
              </td>
              <td className="px-3 py-2 font-lato text-sm text-text-light">
                {formatDate(row.lastLogin)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
