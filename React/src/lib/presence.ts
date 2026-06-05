import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type Listener = (ids: Set<string>) => void;
type PresenceMeta = {
  profile_id?: string;
};

const CHANNEL_NAME = 'afi-online-users';
const HEARTBEAT_MS = 2500;

let channel: RealtimeChannel | null = null;
let trackedUserId: string | null = null;
let starting = false;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let onlineIds: Set<string> = new Set();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(onlineIds);
  }
}

function setsAreEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function setOnline(ids: Set<string>) {
  if (setsAreEqual(ids, onlineIds)) {
    return;
  }
  onlineIds = ids;
  emit();
}

function recompute() {
  if (!channel) {
    return;
  }
  try {
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
    setOnline(ids);
  } catch (error) {
    void error;
  }
}

async function teardownChannel() {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  if (channel) {
    try {
      await channel.untrack();
    } catch (error) {
      void error;
    }
    await supabase.removeChannel(channel);
    channel = null;
  }
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
  await teardownChannel();
  trackedUserId = user.id;
  setOnline(new Set([user.id]));

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
        recompute();
      }
    });

  if (heartbeat) {
    clearInterval(heartbeat);
  }
  heartbeat = setInterval(recompute, HEARTBEAT_MS);

  starting = false;
}

export async function stopPresence(): Promise<void> {
  await teardownChannel();
  trackedUserId = null;
  setOnline(new Set());
}

export function subscribeOnline(listener: Listener): () => void {
  listeners.add(listener);
  listener(onlineIds);
  return () => {
    listeners.delete(listener);
  };
}
