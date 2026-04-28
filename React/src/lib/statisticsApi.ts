import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const statsSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'statistics_demo' }
});

export type PlayerStat = {
  name: string;
  pts: string;
  reb: string;
  ast: string;
  gp: number;
  position: string;
  jersey_number: number;
};

export type Game = {
  date: string;
  opponent: string;
  is_home: boolean;
  warriors_score: number | null;
  opponent_score: number | null;
  status: string;
};

export type Standing = {
  team: string;
  division: string;
  wins: number;
  losses: number;
  conf: string;
};

export async function fetchWarriorsPlayers(): Promise<PlayerStat[]> {
  const { data, error } = await statsSupabase
    .from('players')
    .select(`
      first_name,
      last_name,
      position,
      jersey_number,
      player_stats (
        pts,
        reb,
        ast,
        games_played
      )
    `);

  if (error) throw error;

  return (data ?? []).map((p: any) => {
    const stats = p.player_stats?.[0];
    return {
      name: `${p.first_name} ${p.last_name}`,
      position: p.position ?? "—",
      jersey_number: p.jersey_number,
      pts: stats?.pts?.toFixed(1) ?? "—",
      reb: stats?.reb?.toFixed(1) ?? "—",
      ast: stats?.ast?.toFixed(1) ?? "—",
      gp: stats?.games_played ?? 0,
    };
  });
}

export async function fetchWarriorsGames(): Promise<Game[]> {
  const { data, error } = await statsSupabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((g: any) => ({
    date: g.game_date,
    opponent: g.opponent,
    is_home: g.is_home,
    warriors_score: g.warriors_score,
    opponent_score: g.opponent_score,
    status: g.status,
  }));
}

export async function fetchStandings(): Promise<Standing[]> {
  const { data, error } = await statsSupabase
    .from('standings')
    .select('*')
    .order('wins', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((s: any) => ({
    team: s.team_name,
    division: s.division,
    wins: s.wins,
    losses: s.losses,
    conf: s.conference,
  }));
}

export async function fetchUpcomingGamesFromStats(): Promise<Game[]> {
  const { data, error } = await statsSupabase
    .from('games')
    .select('*')
    .gte('game_date', new Date().toISOString().split('T')[0])
    .order('game_date', { ascending: true })
    .limit(10);

  if (error) {
    console.error("fetchUpcomingGamesFromStats:", error);
    return [];
  }

  return (data ?? []).map((g: any) => ({
    date: g.game_date,
    opponent: g.opponent,
    is_home: g.is_home,
    warriors_score: g.warriors_score,
    opponent_score: g.opponent_score,
    status: g.status,
  }));
}
