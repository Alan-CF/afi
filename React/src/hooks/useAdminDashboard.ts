import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminDashboard,
  type AdminDashboardData,
  type AdminDashboardParams,
} from '../lib/adminDashboardApi';

export function useAdminDashboard(params: AdminDashboardParams) {
  const { startDate, endDate, granularity, autoRange } = params;
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdminDashboard({
        startDate,
        endDate,
        granularity,
        autoRange,
      });
      if (requestId === requestIdRef.current) {
        setData(result);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(
          err instanceof Error ? err : new Error('Failed to load dashboard')
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [startDate, endDate, granularity, autoRange]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
