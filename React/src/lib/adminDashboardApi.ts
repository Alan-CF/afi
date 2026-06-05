import { supabase } from './supabaseClient';

export type ActiveUsersGranularity = 'daily' | 'weekly' | 'monthly';
export type DatePreset = '7d' | '30d' | '90d' | 'all';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type AdminDashboardParams = DateRange & {
  granularity: ActiveUsersGranularity;
};

export type TimePoint = {
  bucket: string;
  label: string;
  value: number;
};

export type AdminKpis = {
  totalUsers: number;
  activeUsers: number;
  loginCount: number;
  gamesPlayed: number;
  uniquePlayers: number;
  roomMessages: number;
  fanEvents: number;
};

export type AdminSeries = {
  loginActivity: TimePoint[];
  activeUsers: TimePoint[];
  gamesPlayed: TimePoint[];
};

export type GameResultRow = {
  key: string;
  label: string;
  plays: number;
  uniquePlayers: number;
  avgPlaysPerUser: number;
  coinsAwarded: number | null;
  lastPlayed: string | null;
};

export type GameSeries = {
  key: string;
  label: string;
  series: TimePoint[];
};

export type AdminUserRow = {
  id: string;
  username: string;
  fullName: string | null;
  role: 'user' | 'admin';
  plays: number;
  fanaticCoins: number;
  eCoins: number;
  streak: number;
  lastLogin: string | null;
};

export type AdminDashboardData = {
  kpis: AdminKpis;
  series: AdminSeries;
  gameResults: GameResultRow[];
  gameSeries: GameSeries[];
  users: AdminUserRow[];
  warnings: string[];
};

type ProfileRow = {
  id: string;
  username: string;
  name: string | null;
  role: 'user' | 'admin' | null;
  fanatic_coins: number | null;
  e_coins: number | null;
  last_login: string | null;
  streak: number | null;
};

type PlayRow = {
  profile_id: string | null;
  created_at: string;
};

type MessageRow = {
  sender_profile_id: string;
  created_at: string;
};

type BucketDef = {
  key: string;
  label: string;
};

type ActivityEvent = {
  time: string | null;
  userId: string | null;
};

type FanaticRow = PlayRow & {
  awarded_points: number | null;
};

type GameSource = {
  key: string;
  label: string;
  rows: PlayRow[];
  plays: number;
  coins: number | null;
};

const MONTH_LABELS = [
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

const MAX_BUCKETS = 5000;
const ROW_LIMIT = 1000;

function rangeToIso(range: DateRange): { startIso: string; endIso: string } {
  return {
    startIso: new Date(`${range.startDate}T00:00:00.000Z`).toISOString(),
    endIso: new Date(`${range.endDate}T23:59:59.999Z`).toISOString(),
  };
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - weekday);
  return day;
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function bucketStart(date: Date, granularity: ActiveUsersGranularity): Date {
  if (granularity === 'weekly') {
    return startOfUtcWeek(date);
  }
  if (granularity === 'monthly') {
    return startOfUtcMonth(date);
  }
  return startOfUtcDay(date);
}

function bucketKey(date: Date, granularity: ActiveUsersGranularity): string {
  const start = bucketStart(date, granularity);
  if (granularity === 'monthly') {
    return start.toISOString().slice(0, 7);
  }
  return start.toISOString().slice(0, 10);
}

function bucketLabel(key: string, granularity: ActiveUsersGranularity): string {
  if (granularity === 'monthly') {
    const [year, month] = key.split('-');
    return `${MONTH_LABELS[Number(month) - 1] ?? month} ${year}`;
  }
  const parts = key.split('-');
  return `${parts[1]}/${parts[2]}`;
}

function buildBuckets(
  startIso: string,
  endIso: string,
  granularity: ActiveUsersGranularity
): BucketDef[] {
  const buckets: BucketDef[] = [];
  const seen = new Set<string>();
  const end = new Date(endIso);
  let cursor = bucketStart(new Date(startIso), granularity);
  let guard = 0;

  while (cursor.getTime() <= end.getTime() && guard < MAX_BUCKETS) {
    const key = bucketKey(cursor, granularity);
    if (!seen.has(key)) {
      seen.add(key);
      buckets.push({ key, label: bucketLabel(key, granularity) });
    }
    if (granularity === 'monthly') {
      cursor = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)
      );
    } else if (granularity === 'weekly') {
      cursor = new Date(cursor.getTime() + 7 * 86_400_000);
    } else {
      cursor = new Date(cursor.getTime() + 86_400_000);
    }
    guard += 1;
  }

  return buckets;
}

function countSeries<T>(
  buckets: BucketDef[],
  rows: T[],
  getTime: (row: T) => string | null,
  granularity: ActiveUsersGranularity
): TimePoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const time = getTime(row);
    if (!time) {
      continue;
    }
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const key = bucketKey(date, granularity);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buckets.map((bucket) => ({
    bucket: bucket.key,
    label: bucket.label,
    value: counts.get(bucket.key) ?? 0,
  }));
}

function distinctUserSeries(
  buckets: BucketDef[],
  events: ActivityEvent[],
  granularity: ActiveUsersGranularity
): TimePoint[] {
  const sets = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.time || !event.userId) {
      continue;
    }
    const date = new Date(event.time);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const key = bucketKey(date, granularity);
    const existing = sets.get(key);
    if (existing) {
      existing.add(event.userId);
    } else {
      sets.set(key, new Set([event.userId]));
    }
  }
  return buckets.map((bucket) => ({
    bucket: bucket.key,
    label: bucket.label,
    value: sets.get(bucket.key)?.size ?? 0,
  }));
}

function distinctPlayers(rows: PlayRow[]): number {
  return new Set(
    rows.map((row) => row.profile_id).filter((id): id is string => Boolean(id))
  ).size;
}

function inRange(value: string, startDate: string, endDate: string): boolean {
  const day = value.slice(0, 10);
  return day >= startDate && day <= endDate;
}

async function safe<T>(
  label: string,
  warnings: string[],
  fallback: T,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    void error;
    if (!warnings.includes(label)) {
      warnings.push(label);
    }
    return fallback;
  }
}

async function fetchProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, name, role, fanatic_coins, e_coins, last_login, streak'
    )
    .order('fanatic_coins', { ascending: false })
    .limit(ROW_LIMIT)
    .returns<ProfileRow[]>();
  if (error) {
    throw error;
  }
  return data ?? [];
}

async function countProfiles(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (error) {
    throw error;
  }
  return count ?? 0;
}

async function fetchPlayRows(
  table: string,
  profileColumn: string,
  startIso: string,
  endIso: string
): Promise<PlayRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select(`${profileColumn}, created_at`)
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(ROW_LIMIT);
  if (error) {
    throw error;
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    profile_id: (row[profileColumn] as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

async function fetchFanaticRows(
  startIso: string,
  endIso: string
): Promise<FanaticRow[]> {
  const { data, error } = await supabase
    .from('fanatic_answers')
    .select('profile_id, created_at, awarded_points')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(ROW_LIMIT)
    .returns<FanaticRow[]>();
  if (error) {
    throw error;
  }
  return data ?? [];
}

async function countTable(
  table: string,
  startIso: string,
  endIso: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startIso)
    .lte('created_at', endIso);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

async function fetchMessages(
  startIso: string,
  endIso: string
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('room_messages')
    .select('sender_profile_id, created_at')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(ROW_LIMIT)
    .returns<MessageRow[]>();
  if (error) {
    throw error;
  }
  return data ?? [];
}

async function countMessages(
  startIso: string,
  endIso: string
): Promise<number> {
  const { count, error } = await supabase
    .from('room_messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startIso)
    .lte('created_at', endIso);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

async function countEvents(): Promise<number> {
  const { count, error } = await supabase
    .from('fan_events')
    .select('*', { count: 'exact', head: true });
  if (error) {
    throw error;
  }
  return count ?? 0;
}

export function presetToRange(preset: DatePreset): DateRange {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  if (preset === 'all') {
    return { startDate: '2020-01-01', endDate };
  }
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const start = new Date(today.getTime() - (days - 1) * 86_400_000);
  return { startDate: start.toISOString().slice(0, 10), endDate };
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString();
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

export async function fetchAdminDashboard(
  params: AdminDashboardParams
): Promise<AdminDashboardData> {
  const { startDate, endDate, granularity } = params;
  const { startIso, endIso } = rangeToIso(params);
  const warnings: string[] = [];
  const buckets = buildBuckets(startIso, endIso, granularity);

  const [
    profiles,
    totalUsers,
    fanaticRows,
    fanaticCount,
    shootRows,
    shootCount,
    quizRows,
    quizCount,
    messages,
    roomMessages,
    fanEvents,
  ] = await Promise.all([
    safe('users', warnings, [] as ProfileRow[], () => fetchProfiles()),
    safe('totalUsers', warnings, 0, () => countProfiles()),
    safe('fanatic', warnings, [] as FanaticRow[], () =>
      fetchFanaticRows(startIso, endIso)
    ),
    safe('fanatic', warnings, 0, () =>
      countTable('fanatic_answers', startIso, endIso)
    ),
    safe('shootYourShot', warnings, [] as PlayRow[], () =>
      fetchPlayRows('shoot_your_shot_games', 'profile_id', startIso, endIso)
    ),
    safe('shootYourShot', warnings, 0, () =>
      countTable('shoot_your_shot_games', startIso, endIso)
    ),
    safe('quizzes', warnings, [] as PlayRow[], () =>
      fetchPlayRows('quiz_attempts', 'profile_id', startIso, endIso)
    ),
    safe('quizzes', warnings, 0, () =>
      countTable('quiz_attempts', startIso, endIso)
    ),
    safe('rooms', warnings, [] as MessageRow[], () =>
      fetchMessages(startIso, endIso)
    ),
    safe('rooms', warnings, 0, () => countMessages(startIso, endIso)),
    safe('events', warnings, 0, () => countEvents()),
  ]);

  const fanaticCoins = fanaticRows.reduce(
    (sum, row) => sum + (row.awarded_points ?? 0),
    0
  );
  const gameSources: GameSource[] = [
    {
      key: 'fanatic',
      label: 'Fanatic',
      rows: fanaticRows,
      plays: fanaticCount,
      coins: fanaticCoins,
    },
    {
      key: 'shoot',
      label: 'Shoot Your Shot',
      rows: shootRows,
      plays: shootCount,
      coins: null,
    },
    {
      key: 'quiz',
      label: 'Quizzes',
      rows: quizRows,
      plays: quizCount,
      coins: null,
    },
  ];

  const allPlayRows: PlayRow[] = [...fanaticRows, ...shootRows, ...quizRows];

  const loginProfiles = profiles.filter(
    (profile) =>
      profile.last_login && inRange(profile.last_login, startDate, endDate)
  );

  const activeIds = new Set<string>();
  loginProfiles.forEach((profile) => activeIds.add(profile.id));
  allPlayRows.forEach((row) => {
    if (row.profile_id) {
      activeIds.add(row.profile_id);
    }
  });
  messages.forEach((row) => activeIds.add(row.sender_profile_id));

  const loginEvents: ActivityEvent[] = loginProfiles.map((profile) => ({
    time: profile.last_login,
    userId: profile.id,
  }));
  const activityEvents: ActivityEvent[] = [
    ...loginEvents,
    ...allPlayRows.map((row) => ({
      time: row.created_at,
      userId: row.profile_id,
    })),
    ...messages.map((row) => ({
      time: row.created_at,
      userId: row.sender_profile_id,
    })),
  ];

  const kpis: AdminKpis = {
    totalUsers,
    activeUsers: activeIds.size,
    loginCount: loginProfiles.length,
    gamesPlayed: fanaticCount + shootCount + quizCount,
    uniquePlayers: distinctPlayers(allPlayRows),
    roomMessages,
    fanEvents,
  };

  const series: AdminSeries = {
    loginActivity: distinctUserSeries(buckets, loginEvents, granularity),
    activeUsers: distinctUserSeries(buckets, activityEvents, granularity),
    gamesPlayed: countSeries(
      buckets,
      allPlayRows,
      (row) => row.created_at,
      granularity
    ),
  };

  const gameResults: GameResultRow[] = gameSources
    .map((source) => {
      const uniquePlayers = distinctPlayers(source.rows);
      const lastPlayed = source.rows.reduce<string | null>((latest, row) => {
        if (!row.created_at) {
          return latest;
        }
        return !latest || row.created_at > latest ? row.created_at : latest;
      }, null);
      return {
        key: source.key,
        label: source.label,
        plays: source.plays,
        uniquePlayers,
        avgPlaysPerUser: uniquePlayers > 0 ? source.plays / uniquePlayers : 0,
        coinsAwarded: source.coins,
        lastPlayed,
      };
    })
    .sort((a, b) => b.plays - a.plays);

  const gameSeries: GameSeries[] = gameSources.map((source) => ({
    key: source.key,
    label: source.label,
    series: countSeries(
      buckets,
      source.rows,
      (row) => row.created_at,
      granularity
    ),
  }));

  const playsByUser = new Map<string, number>();
  allPlayRows.forEach((row) => {
    if (!row.profile_id) {
      return;
    }
    playsByUser.set(row.profile_id, (playsByUser.get(row.profile_id) ?? 0) + 1);
  });

  const users: AdminUserRow[] = profiles.map((profile) => ({
    id: profile.id,
    username: profile.username,
    fullName: profile.name ?? null,
    role: profile.role ?? 'user',
    plays: playsByUser.get(profile.id) ?? 0,
    fanaticCoins: profile.fanatic_coins ?? 0,
    eCoins: profile.e_coins ?? 0,
    streak: profile.streak ?? 0,
    lastLogin: profile.last_login,
  }));

  return {
    kpis,
    series,
    gameResults,
    gameSeries,
    users,
    warnings,
  };
}
