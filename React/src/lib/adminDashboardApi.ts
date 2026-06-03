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
  admins: number;
  activeInRange: number;
  totalFanaticCoins: number;
  totalECoins: number;
  avgCoinsPerUser: number;
  topStreak: number;
};

export type AdminUserRow = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  active: boolean;
  fanaticCoins: number;
  eCoins: number;
  streak: number;
  lastLogin: string | null;
};

export type TopUserRow = {
  id: string;
  username: string;
  fanaticCoins: number;
  eCoins: number;
  streak: number;
};

export type AdminDashboardData = {
  kpis: AdminKpis;
  activitySeries: TimePoint[];
  topUsers: TopUserRow[];
  users: AdminUserRow[];
  warnings: string[];
};

type ProfileRow = {
  id: string;
  username: string;
  role: 'user' | 'admin' | null;
  fanatic_coins: number | null;
  e_coins: number | null;
  last_login: string | null;
  streak: number | null;
};

type BucketDef = {
  key: string;
  label: string;
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
const TOP_USERS_LIMIT = 5;

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

function inRange(value: string, startDate: string, endDate: string): boolean {
  const day = value.slice(0, 10);
  return day >= startDate && day <= endDate;
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

async function fetchProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, fanatic_coins, e_coins, last_login, streak')
    .order('fanatic_coins', { ascending: false })
    .limit(ROW_LIMIT)
    .returns<ProfileRow[]>();
  if (error) {
    throw error;
  }
  return data ?? [];
}

async function countAllProfiles(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (error) {
    throw error;
  }
  return count ?? 0;
}

export async function fetchAdminDashboard(
  params: AdminDashboardParams
): Promise<AdminDashboardData> {
  const { startDate, endDate, granularity } = params;
  const warnings: string[] = [];

  let profiles: ProfileRow[] = [];
  try {
    profiles = await fetchProfiles();
  } catch (error) {
    void error;
    warnings.push('users');
  }

  let totalUsers = profiles.length;
  try {
    totalUsers = await countAllProfiles();
  } catch (error) {
    void error;
    warnings.push('totalUsers');
  }

  const startIso = new Date(`${startDate}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${endDate}T23:59:59.999Z`).toISOString();
  const buckets = buildBuckets(startIso, endIso, granularity);

  const activeProfiles = profiles.filter(
    (profile) =>
      profile.last_login && inRange(profile.last_login, startDate, endDate)
  );

  const activityCounts = new Map<string, number>();
  activeProfiles.forEach((profile) => {
    if (!profile.last_login) {
      return;
    }
    const date = new Date(profile.last_login);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const key = bucketKey(date, granularity);
    activityCounts.set(key, (activityCounts.get(key) ?? 0) + 1);
  });
  const activitySeries: TimePoint[] = buckets.map((bucket) => ({
    bucket: bucket.key,
    label: bucket.label,
    value: activityCounts.get(bucket.key) ?? 0,
  }));

  const totalFanaticCoins = profiles.reduce(
    (sum, profile) => sum + (profile.fanatic_coins ?? 0),
    0
  );
  const totalECoins = profiles.reduce(
    (sum, profile) => sum + (profile.e_coins ?? 0),
    0
  );
  const topStreak = profiles.reduce(
    (max, profile) => Math.max(max, profile.streak ?? 0),
    0
  );

  const kpis: AdminKpis = {
    totalUsers,
    admins: profiles.filter((profile) => profile.role === 'admin').length,
    activeInRange: activeProfiles.length,
    totalFanaticCoins,
    totalECoins,
    avgCoinsPerUser: profiles.length ? totalFanaticCoins / profiles.length : 0,
    topStreak,
  };

  const users: AdminUserRow[] = profiles.map((profile) => ({
    id: profile.id,
    username: profile.username,
    role: profile.role ?? 'user',
    active: profile.last_login
      ? inRange(profile.last_login, startDate, endDate)
      : false,
    fanaticCoins: profile.fanatic_coins ?? 0,
    eCoins: profile.e_coins ?? 0,
    streak: profile.streak ?? 0,
    lastLogin: profile.last_login,
  }));

  const topUsers: TopUserRow[] = profiles
    .slice(0, TOP_USERS_LIMIT)
    .map((profile) => ({
      id: profile.id,
      username: profile.username,
      fanaticCoins: profile.fanatic_coins ?? 0,
      eCoins: profile.e_coins ?? 0,
      streak: profile.streak ?? 0,
    }));

  return {
    kpis,
    activitySeries,
    topUsers,
    users,
    warnings,
  };
}
