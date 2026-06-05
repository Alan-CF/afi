import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

//  Types

export type ShopAuditActionType =
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "PURCHASE_STARTED"
  | "PURCHASE_CANCELED"
  | "ORDER_COMPLETED"
  | "PRODUCT_ENABLED"
  | "PRODUCT_DISABLED"
  | "PRODUCT_CREATED"
  | "PRODUCT_EDITED"
  | "PRODUCT_DELETED";

export type ShopAuditRole = "USER" | "ADMIN";

export type ShopAuditStatus = "SUCCESS" | "FAILED" | "PENDING" | "CANCELED";

export interface ShopAuditLog {
  id: number;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  actorRole: ShopAuditRole;
  actionType: ShopAuditActionType;
  productId: number | null;
  productName: string | null;
  status: ShopAuditStatus;
  details: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ShopAuditFilters {
  search: string;
  actionType: ShopAuditActionType | "ALL";
  actorRole: ShopAuditRole | "ALL";
  status: ShopAuditStatus | "ALL";
  dateFrom: string; // yyyy-mm-dd
  dateTo: string; // yyyy-mm-dd
  productId: string; // optional exact product id
}

export const DEFAULT_AUDIT_FILTERS: ShopAuditFilters = {
  search: "",
  actionType: "ALL",
  actorRole: "ALL",
  status: "ALL",
  dateFrom: "",
  dateTo: "",
  productId: "",
};

const PAGE_SIZE = 20;

interface DbRow {
  id: number;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: ShopAuditRole;
  action_type: ShopAuditActionType;
  product_id: number | null;
  product_name: string | null;
  status: ShopAuditStatus;
  details: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function mapRow(r: DbRow): ShopAuditLog {
  return {
    id: r.id,
    actorId: r.actor_id,
    actorName: r.actor_name ?? "Unknown",
    actorEmail: r.actor_email,
    actorRole: r.actor_role,
    actionType: r.action_type,
    productId: r.product_id,
    productName: r.product_name,
    status: r.status,
    details: r.details,
    metadata: r.metadata ?? {},
    createdAt: r.created_at,
  };
}

//  Hook

export function useShopAuditLogs() {
  const [logs, setLogs] = useState<ShopAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [filters, setFiltersState] = useState<ShopAuditFilters>(DEFAULT_AUDIT_FILTERS);

  // Latest-request guard so out-of-order responses don't clobber state.
  const requestIdRef = useRef(0);

  const setFilters = useCallback((next: Partial<ShopAuditFilters>) => {
    setPage(0); // any filter change resets to the first page
    setFiltersState((prev) => ({ ...prev, ...next }));
  }, []);

  const clearFilters = useCallback(() => {
    setPage(0);
    setFiltersState(DEFAULT_AUDIT_FILTERS);
  }, []);

  const fetchLogs = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    // Newest first (CA02 / FR4), server-side filtering + pagination (CA08 / FR5).
    let query = supabase
      .from("shop_audit_logs")
      .select(
        "id, actor_id, actor_name, actor_email, actor_role, action_type, product_id, product_name, status, details, metadata, created_at",
        { count: "exact" }
      )
      // System / service-role actions have no actor — never surface them.
      .not("actor_id", "is", null)
      .order("created_at", { ascending: false });

    if (filters.actionType !== "ALL") query = query.eq("action_type", filters.actionType);
    if (filters.actorRole !== "ALL") query = query.eq("actor_role", filters.actorRole);
    if (filters.status !== "ALL") query = query.eq("status", filters.status);

    const productId = filters.productId.trim();
    if (productId) query = query.eq("product_id", Number(productId));

    if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
    if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);

    const search = filters.search.trim();
    if (search) {
      const safe = search.replace(/[%,()]/g, " ");
      const ors = [
        `actor_name.ilike.%${safe}%`,
        `actor_email.ilike.%${safe}%`,
        `product_name.ilike.%${safe}%`,
      ];
      if (/^\d+$/.test(search)) ors.push(`product_id.eq.${search}`);
      query = query.or(ors.join(","));
    }

    const from = page * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error: fetchError, count } = await query;

    if (requestId !== requestIdRef.current) return; // a newer request superseded this one

    if (fetchError) {
      console.error(fetchError);
      setError("Failed to load audit logs.");
      setLogs([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLogs((data ?? []).map(mapRow as (r: unknown) => ShopAuditLog));
    setTotal(count ?? 0);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return useMemo(
    () => ({
      logs,
      total,
      loading,
      error,
      filters,
      setFilters,
      clearFilters,
      page,
      setPage,
      pageCount,
      pageSize: PAGE_SIZE,
      refetch: fetchLogs,
    }),
    [logs, total, loading, error, filters, setFilters, clearFilters, page, pageCount, fetchLogs]
  );
}
