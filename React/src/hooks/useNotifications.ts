import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from './useProfile';

export interface Notification {
  id: number;
  title: string;
  body: string;
  profile_id: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user, loading: profileLoading } = useProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  // Adjust state during rendering when user or loading state changes to avoid useEffect cascading renders
  const currentUserId = profileLoading ? null : (user?.id ?? null);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  if (currentUserId !== prevUserId) {
    setPrevUserId(currentUserId);
    setNotifications([]);
    setUnreadCount(0);
  }

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qError } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .eq('profile_id', user.id);

      if (qError) throw qError;
      const notificationsData = (data as Notification[] | null) ?? [];
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n) => !n.read).length);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load notifications')
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || profileLoading) {
      return;
    }
    Promise.resolve().then(() => {
      void fetchNotifications();
    });

    // realtime subscription to keep unread count in-sync
    const channel = supabase
      .channel(`public:notifications:profile_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        () => {
          void fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, profileLoading, fetchNotifications]);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, error, refresh } as const;
}

export function useMarkAsRead() {
  const { user } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markAsRead = useCallback(
    async (id: number) => {
      if (!user) {
        const err = new Error('Not authenticated');
        setError(err);
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        const { error: qError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('read', false)
          .eq('profile_id', user.id);

        if (qError) throw qError;
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to mark notification as read')
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { markAsRead, loading, error } as const;
}

export function useMarkAllAsRead() {
  const { user } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markAllAsRead = useCallback(async () => {
    if (!user) {
      const err = new Error('Not authenticated');
      setError(err);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: qError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('profile_id', user.id)
        .eq('read', false);

      if (qError) throw qError;
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to mark all notifications as read')
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { markAllAsRead, loading, error } as const;
}
