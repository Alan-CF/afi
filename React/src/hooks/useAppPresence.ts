import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { startPresence, stopPresence } from '../lib/presence';

export function useAppPresence() {
  useEffect(() => {
    void startPresence();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        void stopPresence();
      } else {
        void startPresence();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
