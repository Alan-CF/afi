import { formatNumber, type TopUserRow } from '../../lib/adminDashboardApi';

type AdminTopUsersTableProps = {
  rows: TopUserRow[];
};

export default function AdminTopUsersTable({ rows }: AdminTopUsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-container-border">
            <th className="px-3 py-2 font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              #
            </th>
            <th className="px-3 py-2 font-lato text-xs font-bold uppercase tracking-wider text-text-light">
              User
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
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className="border-b border-container-border last:border-0"
            >
              <td className="px-3 py-2 font-anton text-sm text-primary-dark">
                {index + 1}
              </td>
              <td className="px-3 py-2 font-lato text-sm font-semibold text-secondary">
                {row.username}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
