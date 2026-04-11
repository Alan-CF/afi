import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";

export interface LeaderboardEntry {
    profile_id: string;
    rank: number;
    username: string;
    points: number;
    avatar_url: string | null;
}

export interface MyRankInfo {
    profile_id: string;
    rank: number;
    points: number;
    pointsToFirst: number;
    avatar_url: string | null;
    streak: number;
}

export function useLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<MyRankInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: top10, error: topError } = await supabase
                    .from("profiles")
                    .select("id, username, fanatic_coins, avatar_url")
                    .order("fanatic_coins", { ascending: false })
                    .limit(10);

                if (topError) throw topError;

                const entries: LeaderboardEntry[] = (top10 ?? []).map((p, i) => ({
                    profile_id: p.id,
                    rank: i + 1,
                    username: p.username,
                    points: p.fanatic_coins,
                    avatar_url: p.avatar_url,
                }));

                setLeaderboard(entries);

                const session = await getSession();
                if (!session?.user) return;

                const userId = session.user.id;

                const { data: allProfiles, error: allError } = await supabase
                    .from("profiles")
                    .select("id, fanatic_coins, avatar_url")
                    .order("fanatic_coins", { ascending: false });

                if (allError) throw allError;

                const position = (allProfiles ?? []).findIndex((p) => p.id === userId) + 1;
                const userProfile = (allProfiles ?? []).find((p) => p.id === userId);
                const firstPlace = allProfiles?.[0];

                if (!userProfile || !firstPlace) return;

                const { data: streakData } = await supabase
                    .from("profiles")
                    .select("streak")
                    .eq("id", userId)
                    .single();

                setMyRank({
                    profile_id: userId,
                    rank: position,
                    points: userProfile.fanatic_coins,
                    pointsToFirst: position === 1 ? 0 : firstPlace.fanatic_coins - userProfile.fanatic_coins,
                    avatar_url: userProfile.avatar_url ?? null,
                    streak: streakData?.streak ?? 0,
                });
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { leaderboard, myRank, loading, error };
}
