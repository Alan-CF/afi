import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";

export interface HomeProfile {
    username: string;
    points: number;
    rank: number;
    streak: number;
    avatar_url: string | null;
}

export interface Challenge {
    id: string;
    name: string;
    points: number;
    duration: string;
    image_url: string | null;
}

export interface GameEvent {
    id: string;
    name: string;
    date: string;
    location: string;
    image_url: string | null;
}

export function useHome() {
    const [profile, setProfile] = useState<HomeProfile | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [events, setEvents] = useState<GameEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const session = await getSession();
                if (!session?.user) return;

                const userId = session.user.id;

                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, username, fanatic_coins, avatar_url, streak")
                    .eq("id", userId)
                    .single();

                if (profileError) throw profileError;

                const { data: allProfiles, error: rankError } = await supabase
                    .from("profiles")
                    .select("id, fanatic_coins")
                    .order("fanatic_coins", { ascending: false });

                if (rankError) throw rankError;

                const position = (allProfiles ?? []).findIndex((p) => p.id === userId) + 1;

                setProfile({
                    username: profileData.username,
                    points: profileData.fanatic_coins,
                    rank: position,
                    streak: profileData.streak ?? 0,
                    avatar_url: profileData.avatar_url ?? null,
                });

                const { data: gamesData } = await supabase
                    .from("fanatic_games")
                    .select("id, game_category, end_date")
                    .order("end_date", { ascending: false })
                    .limit(4);

                setChallenges(
                    (gamesData ?? []).map((g) => ({
                        id: String(g.id),
                        name: g.game_category
                            ? g.game_category.charAt(0).toUpperCase() + g.game_category.slice(1) + " Challenge"
                            : "Fanatic Challenge",
                        points: 1000,
                        duration: g.end_date
                            ? new Date(g.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : "Ongoing",
                        image_url: null,
                    }))
                );
            } catch {
                setError(true);
            }

            try {
                const { data: eventData } = await supabase
                    .from("events")
                    .select("id, name, date, location, image_url")
                    .order("date", { ascending: true })
                    .limit(3);

                setEvents(eventData ?? []);
            } catch {
                setEvents([]);
            }

            setLoading(false);
        }

        fetchData();
    }, []);

    return { profile, challenges, events, loading, error };
}
