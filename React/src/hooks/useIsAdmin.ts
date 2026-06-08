import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type IsAdminState = {
  isAdmin: boolean;
  loading: boolean;
  userId: string | null;
};

export function useIsAdmin(): IsAdminState {
  const [state, setState] = useState<IsAdminState>({
    isAdmin: false,
    loading: true,
    userId: null,
  });

  useEffect(() => {
    let active = true;

    const resolve = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (active) {
            setState({ isAdmin: false, loading: false, userId: null });
          }
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle<{ role: string | null }>();

        if (active) {
          setState({
            isAdmin: data?.role === 'admin',
            loading: false,
            userId: user.id,
          });
        }
      } catch (error) {
        void error;
        if (active) {
          setState({ isAdmin: false, loading: false, userId: null });
        }
      }
    };

    void resolve();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
