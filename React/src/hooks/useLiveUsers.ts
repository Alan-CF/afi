import { useEffect, useState } from 'react';
import { subscribeOnline } from '../lib/presence';

type LiveUsersState = {
  onlineUserIds: Set<string>;
  onlineCount: number;
};

export function useLiveUsers(): LiveUsersState {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    return subscribeOnline((ids) => setOnlineUserIds(new Set(ids)));
  }, []);

  return { onlineUserIds, onlineCount: onlineUserIds.size };
}
