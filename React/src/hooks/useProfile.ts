import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

type ProfileState = {
  user: UserProfileData | null;
  loading: boolean;
  hasLoadedOnce: boolean;
  error: Error | null;
};

type ProfileRow = Omit<UserProfileData, 'full_name'>;

type PointEventMeta = {
  label: string | null;
  description: string | null;
};

type LatestPointLogRow = {
  points: number;
  created_at: string;
  event_key: string;
  point_events: PointEventMeta | PointEventMeta[] | null;
};

async function resolveAuthenticatedUserId(): Promise<{
  userId: string | null;
  error: Error | null;
}> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { userId: null, error: authError };
  }

  const isAnonymousUser =
    authUser?.is_anonymous || authUser?.app_metadata?.provider === 'anonymous';

  if (!authUser || isAnonymousUser) {
    return { userId: null, error: null };
  }

  return { userId: authUser.id, error: null };
}

async function updateLoginStreak(userId: string) {
  const { error } = await supabase.rpc('update_login_streak', { user_id: userId });
  if (error) {
    console.warn('Failed to update login streak:', error.message);
  }
}

async function fetchProfile(userId: string): Promise<UserProfileData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>();

  if (error || !data) {
    throw error ?? new Error('Profile not found');
  }

  return {
    ...data,
    full_name: data.name ?? data.username,
  };
}

async function emitRecentPointsToast(userId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const { data: latestLog } = await supabase
    .from('point_logs')
    .select('points, created_at, event_key, point_events(label, description)')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<LatestPointLogRow>();

  if (!latestLog) {
    return;
  }

  const logDate = new Date(latestLog.created_at);
  const isRecent = Date.now() - logDate.getTime() < 30_000;

  if (!isRecent) {
    return;
  }

  const toastKey = `points-toast-${latestLog.created_at}`;
  if (sessionStorage.getItem(toastKey)) {
    return;
  }
  sessionStorage.setItem(toastKey, '1');

  const eventMeta = Array.isArray(latestLog.point_events)
    ? latestLog.point_events[0]
    : latestLog.point_events;

  window.dispatchEvent(
    new CustomEvent('points-earned', {
      detail: {
        points: latestLog.points,
        label: eventMeta?.label ?? latestLog.event_key,
        description: eventMeta?.description ?? '',
        eventKey: latestLog.event_key,
      },
    })
  );
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    user: null,
    loading: true,
    hasLoadedOnce: false,
    error: null,
  });
  const inFlightRef = useRef<Promise<void> | null>(null);

  const loadProfile = useCallback(async (showLoader = false) => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    if (showLoader) {
      setState((prev) => ({ ...prev, loading: true }));
    }

    const request = (async () => {
      try {
        const { userId, error: authError } = await resolveAuthenticatedUserId();

        if (authError || !userId) {
          setState({
            user: null,
            loading: false,
            hasLoadedOnce: true,
            error: authError,
          });
          return;
        }

        await updateLoginStreak(userId);
        const profile = await fetchProfile(userId);

        setState({
          user: profile,
          loading: false,
          hasLoadedOnce: true,
          error: null,
        });

        void emitRecentPointsToast(userId);
      } catch (error) {
        setState({
          user: null,
          loading: false,
          hasLoadedOnce: true,
          error: error instanceof Error ? error : new Error('Failed to load profile'),
        });
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    void loadProfile(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile(false);
    });

    const onProfileUpdated = () => {
      void loadProfile(false);
    };
    window.addEventListener('profile-updated', onProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', onProfileUpdated);
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(false);
  }, [loadProfile]);

  return {
    user: state.user,
    loading: state.loading,
    hasLoadedOnce: state.hasLoadedOnce,
    error: state.error,
    refreshProfile,
  };
}
