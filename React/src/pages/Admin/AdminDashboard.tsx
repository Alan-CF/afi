import { useState } from 'react';
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
import AdminDateRangeFilter from '../../components/admin/AdminDateRangeFilter';
import AdminTimeSeriesChart from '../../components/admin/AdminTimeSeriesChart';
import AdminUsersTable from '../../components/admin/AdminUsersTable';
import AdminTopUsersTable from '../../components/admin/AdminTopUsersTable';
import BasketballLoader from '../../components/common/BasketballLoader';
import EmptyState from '../../components/common/EmptyState';

const DEFAULT_RANGE = presetToRange('30d');

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

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 min-[900px]:px-6 xl:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-anton text-3xl uppercase tracking-wide text-secondary md:text-4xl">
            Admin Dashboard
          </h1>
          {loading && data && (
            <span className="rounded-full bg-secondary/10 px-3 py-1 font-lato text-xs font-bold uppercase tracking-wider text-secondary">
              Updating…
            </span>
          )}
        </div>
        <p className="mt-2 max-w-2xl font-lato text-text-light">
          Monitor fan accounts, the coin economy and login activity across the
          platform.
        </p>
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
        <div className="flex flex-col gap-6">
          {data.warnings.length > 0 && (
            <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 font-lato text-sm text-text">
              Some metrics could not be loaded: {data.warnings.join(', ')}.
            </div>
          )}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <AdminKpiCard
              label="Total users"
              value={formatNumber(data.kpis.totalUsers)}
              accent="blue"
            />
            <AdminKpiCard
              label="Admins"
              value={formatNumber(data.kpis.admins)}
              accent="gold"
            />
            <AdminKpiCard
              label="Active in period"
              value={formatNumber(data.kpis.activeInRange)}
              hint="By last login"
              accent="green"
            />
            <AdminKpiCard
              label="Top streak"
              value={formatNumber(data.kpis.topStreak)}
              hint="Longest login streak"
              accent="red"
            />
            <AdminKpiCard
              label="Total fanatic coins"
              value={formatNumber(data.kpis.totalFanaticCoins)}
              accent="gold"
            />
            <AdminKpiCard
              label="Total e-coins"
              value={formatNumber(data.kpis.totalECoins)}
              accent="blue"
            />
            <AdminKpiCard
              label="Avg coins / user"
              value={formatDecimal(data.kpis.avgCoinsPerUser)}
              accent="green"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
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

            <AdminCard title="Top users" subtitle="Ranked by Fanatic coins">
              {data.topUsers.length > 0 ? (
                <AdminTopUsersTable rows={data.topUsers} />
              ) : (
                <EmptyState message="No users to rank yet." variant="compact" />
              )}
            </AdminCard>
          </section>

          <AdminCard title="Users" subtitle="Registered fans and their balances">
            {data.users.length > 0 ? (
              <AdminUsersTable rows={data.users} />
            ) : (
              <EmptyState message="No users found." variant="compact" />
            )}
          </AdminCard>
        </div>
      ) : null}
    </main>
  );
}
