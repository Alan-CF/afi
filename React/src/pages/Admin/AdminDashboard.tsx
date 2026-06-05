import { useState } from 'react';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PuzzlePieceIcon,
  SignalIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { usePresence } from '../../hooks/usePresence';
import {
  formatNumber,
  presetToRange,
  type ActiveUsersGranularity,
  type AdminDashboardData,
  type DateRange,
  type TimePoint,
} from '../../lib/adminDashboardApi';
import AdminCard from '../../components/admin/AdminCard';
import AdminKpiCard from '../../components/admin/AdminKpiCard';
import AdminDateRangeFilter, {
  friendlyRange,
} from '../../components/admin/AdminDateRangeFilter';
import AdminTimeSeriesChart from '../../components/admin/AdminTimeSeriesChart';
import AdminGameResultsTable from '../../components/admin/AdminGameResultsTable';
import AdminUsersTable from '../../components/admin/AdminUsersTable';
import BasketballLoader from '../../components/common/BasketballLoader';
import EmptyState from '../../components/common/EmptyState';

const DEFAULT_RANGE = presetToRange('30d');

type SectionKey = 'overview' | 'activity' | 'games' | 'users';

const SECTION_OPTIONS: readonly { key: SectionKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'games', label: 'Games' },
  { key: 'users', label: 'Users' },
];

function hasSeriesData(series: TimePoint[]): boolean {
  return series.some((point) => point.value > 0);
}

function activeUsersSubtitle(granularity: ActiveUsersGranularity): string {
  if (granularity === 'weekly') {
    return 'Weekly active users';
  }
  if (granularity === 'monthly') {
    return 'Monthly active users';
  }
  return 'Daily active users';
}

function gamesSubtitle(granularity: ActiveUsersGranularity): string {
  if (granularity === 'weekly') {
    return 'Game plays per week';
  }
  if (granularity === 'monthly') {
    return 'Game plays per month';
  }
  return 'Game plays per day';
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildDashboardCsv(
  data: AdminDashboardData,
  onlineUserIds: Set<string>,
  range: DateRange
): string {
  const lines: string[] = [];
  lines.push('AFI Admin Dashboard');
  lines.push(`Range,${range.startDate} to ${range.endDate}`);
  lines.push('');
  lines.push('KPIs');
  lines.push('Metric,Value');
  lines.push(`Total users,${data.kpis.totalUsers}`);
  lines.push(`Live users,${onlineUserIds.size}`);
  lines.push(`Active users,${data.kpis.activeUsers}`);
  lines.push(`Games played,${data.kpis.gamesPlayed}`);
  lines.push(`Room messages,${data.kpis.roomMessages}`);
  lines.push(`Fan events,${data.kpis.fanEvents}`);
  lines.push('');
  lines.push('Game performance');
  lines.push(
    'Game,Plays,Unique players,Avg plays/user,Coins awarded,Last played'
  );
  for (const game of data.gameResults) {
    lines.push(
      [
        csvCell(game.label),
        game.plays,
        game.uniquePlayers,
        game.avgPlaysPerUser.toFixed(2),
        game.coinsAwarded === null ? '' : game.coinsAwarded,
        game.lastPlayed ?? '',
      ].join(',')
    );
  }
  lines.push('');
  lines.push('Users');
  lines.push('Username,Name,Status,Role,Plays,Coins,E-coins,Streak,Last login');
  for (const user of data.users) {
    lines.push(
      [
        csvCell(user.username),
        csvCell(user.fullName ?? ''),
        onlineUserIds.has(user.id) ? 'Live' : 'Offline',
        user.role,
        user.plays,
        user.fanaticCoins,
        user.eCoins,
        user.streak,
        user.lastLogin ?? '',
      ].join(',')
    );
  }
  return lines.join('\n');
}

function downloadDashboardCsv(
  data: AdminDashboardData,
  onlineUserIds: Set<string>,
  range: DateRange
) {
  const csv = buildDashboardCsv(data, onlineUserIds, range);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `afi-admin-dashboard-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div className="mb-4">
      <div className="h-1 w-10 rounded-full bg-primary" />
      <h2 className="mt-2 font-anton text-xl leading-tight text-secondary md:text-2xl">
        {children}
      </h2>
    </div>
  );
}

export default function AdminDashboard() {
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [granularity] = useState<ActiveUsersGranularity>('daily');
  const [selectedGame, setSelectedGame] = useState('all');
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    overview: true,
    activity: true,
    games: true,
    users: true,
  });

  const onlineUserIds = usePresence();
  const onlineCount = onlineUserIds.size;

  const { data, loading, error, refetch } = useAdminDashboard({
    startDate: range.startDate,
    endDate: range.endDate,
    granularity,
  });

  const toggleSection = (key: SectionKey) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const gamesChartData =
    selectedGame === 'all'
      ? (data?.series.gamesPlayed ?? [])
      : (data?.gameSeries.find((g) => g.key === selectedGame)?.series ??
        data?.series.gamesPlayed ??
        []);

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-16 md:px-6 md:pt-8 md:pb-20 lg:px-8">
        <header className="mb-5 flex items-center gap-3">
          <h1 className="font-anton text-3xl leading-none text-secondary md:text-4xl">
            Dashboard
          </h1>
          <button
            type="button"
            onClick={() => {
              if (data) {
                downloadDashboardCsv(data, onlineUserIds, range);
              }
            }}
            disabled={!data}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-secondary bg-white px-3.5 font-lato text-xs font-bold text-secondary transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-secondary"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export
          </button>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <AdminDateRangeFilter
            startDate={range.startDate}
            endDate={range.endDate}
            onRangeChange={setRange}
          />

          <p className="font-lato text-xs font-bold text-secondary sm:order-last sm:w-full">
            {friendlyRange(range.startDate, range.endDate)}
          </p>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {SECTION_OPTIONS.map((option) => {
              const isOn = sections[option.key];
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleSection(option.key)}
                  aria-pressed={isOn}
                  className={`shrink-0 rounded-full border-2 px-3 py-1.5 font-lato text-xs font-bold uppercase tracking-wider transition-colors ${
                    isOn
                      ? 'border-secondary bg-secondary text-white'
                      : 'border-container-border bg-white text-text-light hover:border-secondary hover:text-secondary'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading && !data ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <BasketballLoader size="lg" />
          </div>
        ) : error && !data ? (
          <div className="mt-6 rounded-3xl border border-container-border bg-white p-6 text-center shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <p className="font-lato text-text">
              Something went wrong while loading the dashboard.
            </p>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="mt-4 rounded-full bg-primary px-6 py-2.5 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d]"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <div className="mt-6 flex flex-col gap-6">
            {data.warnings.length > 0 && (
              <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 font-lato text-sm text-text">
                Some metrics couldn't load ({data.warnings.join(', ')}). If most
                sections are empty, the admin analytics migration may need to be
                applied.
              </div>
            )}

            {sections.overview && (
              <section>
                <SectionHeader>Engagement overview</SectionHeader>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <AdminKpiCard
                    label="Total users"
                    value={formatNumber(data.kpis.totalUsers)}
                    hint="Registered fans"
                    tone="blue"
                    icon={<UserGroupIcon className="h-5 w-5" />}
                  />
                  <AdminKpiCard
                    label="Live users"
                    value={formatNumber(onlineCount)}
                    hint="Online now"
                    tone="gold"
                    icon={<SignalIcon className="h-5 w-5" />}
                  />
                  <AdminKpiCard
                    label="Active users"
                    value={formatNumber(data.kpis.activeUsers)}
                    hint="Login, games or rooms"
                    tone="blue"
                    icon={<UsersIcon className="h-5 w-5" />}
                  />
                  <AdminKpiCard
                    label="Games played"
                    value={formatNumber(data.kpis.gamesPlayed)}
                    hint="Fanatic · Shoot Your Shot · Quizzes"
                    tone="gold"
                    icon={<PuzzlePieceIcon className="h-5 w-5" />}
                  />
                  <AdminKpiCard
                    label="Room messages"
                    value={formatNumber(data.kpis.roomMessages)}
                    hint="In period"
                    tone="blue"
                    icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
                  />
                  <AdminKpiCard
                    label="Fan events"
                    value={formatNumber(data.kpis.fanEvents)}
                    hint="Created"
                    tone="blue"
                    icon={<CalendarDaysIcon className="h-5 w-5" />}
                  />
                </div>
              </section>
            )}

            {sections.activity && (
              <section>
                <SectionHeader>Activity</SectionHeader>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <AdminCard
                      title="Login activity"
                      subtitle="Users logged in by last login"
                      className="min-w-0"
                    >
                      {hasSeriesData(data.series.loginActivity) ? (
                        <AdminTimeSeriesChart
                          data={data.series.loginActivity}
                          variant="line"
                          color="#1D428A"
                          valueLabel="Users logged in"
                          xLabel="Date"
                          yLabel="Users"
                        />
                      ) : (
                        <EmptyState
                          message="No login activity in this period."
                          variant="compact"
                        />
                      )}
                    </AdminCard>

                    <AdminCard
                      title="Active users over time"
                      subtitle={activeUsersSubtitle(granularity)}
                      className="min-w-0"
                    >
                      {hasSeriesData(data.series.activeUsers) ? (
                        <AdminTimeSeriesChart
                          data={data.series.activeUsers}
                          variant="line"
                          color="#BB921F"
                          valueLabel="Active users"
                          xLabel="Date"
                          yLabel="Users"
                        />
                      ) : (
                        <EmptyState
                          message="No active users in this period."
                          variant="compact"
                        />
                      )}
                    </AdminCard>
                  </div>

                  <AdminCard
                    title="Games played"
                    subtitle={gamesSubtitle(granularity)}
                    className="min-w-0"
                    actions={
                      <select
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value)}
                        className="h-9 rounded-xl border-2 border-container-border bg-white px-3 font-lato text-xs font-bold text-secondary focus:border-secondary focus:outline-none"
                        aria-label="Filter by game"
                      >
                        <option value="all">All games</option>
                        {data.gameSeries.map((game) => (
                          <option key={game.key} value={game.key}>
                            {game.label}
                          </option>
                        ))}
                      </select>
                    }
                  >
                    {hasSeriesData(gamesChartData) ? (
                      <AdminTimeSeriesChart
                        data={gamesChartData}
                        variant="bar"
                        color="#1D428A"
                        valueLabel="Plays"
                        xLabel="Date"
                        yLabel="Plays"
                      />
                    ) : (
                      <EmptyState
                        message="No game activity in this period."
                        variant="compact"
                      />
                    )}
                  </AdminCard>
                </div>
              </section>
            )}

            {sections.games && (
              <AdminCard
                title="Game performance"
                subtitle="Plays, players and coins per game"
              >
                {data.gameResults.length > 0 ? (
                  <AdminGameResultsTable rows={data.gameResults} />
                ) : (
                  <EmptyState message="No games found." variant="compact" />
                )}
              </AdminCard>
            )}

            {sections.users && (
              <AdminCard title="Users" subtitle="Engagement, roles and balances">
                {data.users.length > 0 ? (
                  <AdminUsersTable
                    rows={data.users}
                    onlineUserIds={onlineUserIds}
                  />
                ) : (
                  <EmptyState message="No users found." variant="compact" />
                )}
              </AdminCard>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
