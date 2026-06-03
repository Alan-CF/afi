import { useState } from 'react';
import {
  BoltIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  FireIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import {
  formatDecimal,
  formatNumber,
  presetToRange,
  type ActiveUsersGranularity,
  type DateRange,
  type TimePoint,
} from '../../lib/adminDashboardApi';
import AdminCard from '../../components/admin/AdminCard';
import AdminKpiCard from '../../components/admin/AdminKpiCard';
import AdminBadge from '../../components/admin/AdminBadge';
import AdminDateRangeFilter from '../../components/admin/AdminDateRangeFilter';
import AdminTimeSeriesChart from '../../components/admin/AdminTimeSeriesChart';
import AdminUsersTable from '../../components/admin/AdminUsersTable';
import BasketballLoader from '../../components/common/BasketballLoader';
import EmptyState from '../../components/common/EmptyState';

const DEFAULT_RANGE = presetToRange('30d');

const MONTHS_SHORT = [
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

const RANK_BADGE = [
  'bg-rank-gold text-secondary',
  'bg-rank-silver text-white',
  'bg-rank-bronze text-white',
];

function rankBadgeClass(index: number): string {
  return RANK_BADGE[index] ?? 'bg-secondary/10 text-secondary';
}

function shortDate(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return value;
  }
  return `${MONTHS_SHORT[Number(month) - 1] ?? month} ${Number(day)}`;
}

function hasSeriesData(series: TimePoint[]): boolean {
  return series.some((point) => point.value > 0);
}

function activitySubtitle(granularity: ActiveUsersGranularity): string {
  if (granularity === 'weekly') {
    return 'Active users per week (by last login)';
  }
  if (granularity === 'monthly') {
    return 'Active users per month (by last login)';
  }
  return 'Active users per day (by last login)';
}

export default function AdminDashboard() {
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [granularity, setGranularity] =
    useState<ActiveUsersGranularity>('daily');

  const { data, loading, error, refetch } = useAdminDashboard({
    startDate: range.startDate,
    endDate: range.endDate,
    granularity,
  });

  const rangeLabel = `${shortDate(range.startDate)} – ${shortDate(range.endDate)}`;

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 min-[900px]:px-6 md:py-8 xl:px-8">
      <header className="relative mb-6 overflow-hidden rounded-2xl border border-secondary/20 bg-[linear-gradient(135deg,#1D428A_0%,#15294d_100%)] p-6 text-white shadow-sm md:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-28 h-44 w-44 rounded-full bg-white/5 blur-2xl"
        />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-anton text-3xl uppercase tracking-wide md:text-4xl">
              Admin Dashboard
            </h1>
            <AdminBadge variant="gold">Admin only</AdminBadge>
          </div>
          <p className="max-w-2xl font-lato text-sm text-white/80 md:text-base">
            Monitor fan accounts, login activity and the AFI coin economy.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge variant="light">{rangeLabel}</AdminBadge>
            {loading && data && (
              <AdminBadge variant="light">Updating…</AdminBadge>
            )}
          </div>
        </div>
      </header>

      <div className="mb-6">
        <AdminDateRangeFilter
          startDate={range.startDate}
          endDate={range.endDate}
          granularity={granularity}
          onRangeChange={setRange}
          onGranularityChange={setGranularity}
        />
      </div>

      {loading && !data ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <BasketballLoader size="lg" />
        </div>
      ) : error && !data ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-lato text-text">
            Something went wrong while loading the dashboard.
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-4 rounded-2xl bg-primary px-6 py-3 font-lato font-bold text-secondary lift-on-hover"
          >
            Try again
          </button>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-8">
          {data.warnings.length > 0 && (
            <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 font-lato text-sm text-text">
              Some metrics could not be loaded: {data.warnings.join(', ')}.
            </div>
          )}

          <section>
            <h2 className="mb-3 font-anton text-sm uppercase tracking-widest text-text-light">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <AdminKpiCard
                label="Total users"
                value={formatNumber(data.kpis.totalUsers)}
                tone="blue"
                icon={<UserGroupIcon className="h-5 w-5" />}
              />
              <AdminKpiCard
                label="Admins"
                value={formatNumber(data.kpis.admins)}
                tone="blue"
                icon={<ShieldCheckIcon className="h-5 w-5" />}
              />
              <AdminKpiCard
                label="Active in period"
                value={formatNumber(data.kpis.activeInRange)}
                hint="By last login"
                tone="blue"
                icon={<BoltIcon className="h-5 w-5" />}
              />
              <AdminKpiCard
                label="Top streak"
                value={formatNumber(data.kpis.topStreak)}
                hint="Longest login streak"
                tone="gold"
                icon={<FireIcon className="h-5 w-5" />}
              />
              <AdminKpiCard
                label="Total fanatic coins"
                value={formatNumber(data.kpis.totalFanaticCoins)}
                tone="gold"
                icon={<CurrencyDollarIcon className="h-5 w-5" />}
              />
              <AdminKpiCard
                label="Total e-coins"
                value={formatNumber(data.kpis.totalECoins)}
                tone="gold"
                icon={<WalletIcon className="h-5 w-5" />}
              />
              <AdminKpiCard
                label="Avg coins / user"
                value={formatDecimal(data.kpis.avgCoinsPerUser)}
                tone="gold"
                icon={<ChartBarIcon className="h-5 w-5" />}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-anton text-sm uppercase tracking-widest text-text-light">
              Activity
            </h2>
            <AdminCard
              title="Login activity"
              subtitle={activitySubtitle(granularity)}
            >
              {hasSeriesData(data.activitySeries) ? (
                <AdminTimeSeriesChart
                  data={data.activitySeries}
                  variant="line"
                  color="#1D428A"
                  valueLabel="Active users"
                />
              ) : (
                <EmptyState
                  message="No login activity in this period."
                  variant="compact"
                />
              )}
            </AdminCard>
          </section>

          <section>
            <h2 className="mb-3 font-anton text-sm uppercase tracking-widest text-text-light">
              Leaderboard
            </h2>
            <AdminCard title="Top fans" subtitle="Highest Fanatic coin balances">
              {data.topUsers.length > 0 ? (
                <ol className="flex flex-col gap-2">
                  {data.topUsers.map((fan, index) => (
                    <li
                      key={fan.id}
                      className="flex items-center gap-3 rounded-xl border border-container-border px-3 py-2.5"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-anton text-sm ${rankBadgeClass(index)}`}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-lato font-semibold text-secondary">
                        {fan.username}
                      </span>
                      <span className="shrink-0 font-anton text-lg text-secondary">
                        {formatNumber(fan.fanaticCoins)}
                      </span>
                      <span className="shrink-0 font-lato text-xs uppercase tracking-wider text-text-light">
                        coins
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState message="No users to rank yet." variant="compact" />
              )}
            </AdminCard>
          </section>

          <section>
            <h2 className="mb-3 font-anton text-sm uppercase tracking-widest text-text-light">
              All users
            </h2>
            <AdminCard
              title="Users"
              subtitle="Registered fans, roles and balances"
            >
              {data.users.length > 0 ? (
                <AdminUsersTable rows={data.users} />
              ) : (
                <EmptyState message="No users found." variant="compact" />
              )}
            </AdminCard>
          </section>
        </div>
      ) : null}
    </main>
  );
}
