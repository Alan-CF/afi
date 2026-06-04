import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type Listener = (ids: Set<string>) => void;
type PresenceMeta = {
  profile_id?: string;
};

const CHANNEL_NAME = 'afi-online-users';

let channel: RealtimeChannel | null = null;
let trackedUserId: string | null = null;
let starting = false;
let onlineIds: Set<string> = new Set();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(onlineIds);
  }
}

function recompute() {
  if (!channel) {
    return;
  }
  const state = channel.presenceState<PresenceMeta>();
  const ids = new Set<string>();
  for (const key of Object.keys(state)) {
    for (const entry of state[key]) {
      ids.add(entry.profile_id ?? key);
    }
  }
  if (trackedUserId) {
    ids.add(trackedUserId);
  }
  onlineIds = ids;
  emit();
}

export async function startPresence(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    await stopPresence();
    return;
  }
  if (channel && trackedUserId === user.id) {
    return;
  }
  if (starting) {
    return;
  }
  starting = true;
  await stopPresence();
  trackedUserId = user.id;

  try {
    await supabase.realtime.setAuth(session.access_token);
  } catch (error) {
    void error;
  }

  let username = 'Fan';
  try {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle<{ username: string | null }>();
    if (data?.username) {
      username = data.username;
    }
  } catch (error) {
    void error;
  }
  if (trackedUserId !== user.id) {
    starting = false;
    return;
  }

  const presenceChannel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: user.id } },
  });
  channel = presenceChannel;

  onlineIds = new Set([user.id]);
  emit();

  presenceChannel
    .on('presence', { event: 'sync' }, recompute)
    .on('presence', { event: 'join' }, recompute)
    .on('presence', { event: 'leave' }, recompute)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void presenceChannel.track({
          profile_id: user.id,
          username,
          online_at: new Date().toISOString(),
        });
      }
    });

  starting = false;
}

export async function stopPresence(): Promise<void> {
  if (channel) {
    try {
      await channel.untrack();
    } catch (error) {
      void error;
    }
    await supabase.removeChannel(channel);
    channel = null;
  }
  trackedUserId = null;
  onlineIds = new Set();
  emit();
}

export function subscribeOnline(listener: Listener): () => void {
  listeners.add(listener);
  listener(onlineIds);
  return () => {
    listeners.delete(listener);
  };
}
