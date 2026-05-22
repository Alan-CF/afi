import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';

export interface UserProfileData {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
    fanatic_coins: number;
    e_coins: number;
    selected_frame_id: string | null;
    caption: string | null;
    streak: number;
    name: string | null;
}

export function useProfile() {
    const [user, setUser] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const getUser = async (showLoader = false) => {
        if (showLoader) setLoading(true);

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        const isAnonymousUser =
            authUser?.is_anonymous ||
            authUser?.app_metadata?.provider === "anonymous";

        if (authError || !authUser || isAnonymousUser) {
            setUser(null);
            setError(authError ?? null);
            setLoading(false);
            setHasLoadedOnce(true);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError) {
            setUser(null);
            setError(profileError);
            setLoading(false);
            setHasLoadedOnce(true);
            return;
        }

        await supabase.rpc("update_login_streak", { user_id: authUser.id });

        const { data: updatedProfile, error: updatedError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

        if (updatedError) {
            setUser(null);
            setError(updatedError);
        } else {
            setUser({
                ...updatedProfile,
                full_name: updatedProfile.name ?? updatedProfile.username,
            });
            setError(null);

            const { data: latestLog } = await supabase
                .from("point_logs")
                .select("points, created_at, event_key, point_events(label, description)")
                .eq("profile_id", authUser.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (latestLog) {
                const logDate = new Date(latestLog.created_at);
                const now = new Date();
                const isRecent = (now.getTime() - logDate.getTime()) < 30_000;

                if (isRecent) {
                    const toastKey = `points-toast-${latestLog.created_at}`;
                    if (!sessionStorage.getItem(toastKey)) {
                        sessionStorage.setItem(toastKey, "1");
                        window.dispatchEvent(new CustomEvent("points-earned", {
                            detail: {
                                points: latestLog.points,
                                label: (latestLog as any).point_events?.label ?? latestLog.event_key,
                                description: (latestLog as any).point_events?.description ?? "",
                                eventKey: latestLog.event_key,
                            }
                        }));
                    }
                }
            }
        }

        setLoading(false);
        setHasLoadedOnce(true);
    };

    useEffect(() => {
        getUser(true);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            getUser(false);
        });

        const onProfileUpdated = () => getUser(false);
        window.addEventListener("profile-updated", onProfileUpdated);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("profile-updated", onProfileUpdated);
        };
    }, []);

    const refreshProfile = async () => {
        await getUser(false);
        window.dispatchEvent(new CustomEvent("profile-updated"));
    };

    return { user, loading, hasLoadedOnce, error, refreshProfile };
}