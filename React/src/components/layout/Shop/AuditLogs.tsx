import { useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import {
  useShopAuditLogs,
  type ShopAuditActionType,
  type ShopAuditRole,
  type ShopAuditStatus,
} from "../../../hooks/useShopAuditLogs";

//  Label + style maps

const ACTION_LABELS: Record<ShopAuditActionType, string> = {
  ADD_TO_CART: "Added to cart",
  REMOVE_FROM_CART: "Removed from cart",
  PURCHASE_STARTED: "Purchase started",
  PURCHASE_CANCELED: "Purchase canceled",
  ORDER_COMPLETED: "Order completed",
  PRODUCT_ENABLED: "Product enabled",
  PRODUCT_DISABLED: "Product disabled",
  PRODUCT_CREATED: "Product created",
  PRODUCT_EDITED: "Product edited",
  PRODUCT_DELETED: "Product deleted",
};

// Tailwind badge classes keyed by action (kept readable, no new colors).
const ACTION_BADGE: Record<ShopAuditActionType, string> = {
  ADD_TO_CART: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REMOVE_FROM_CART: "bg-amber-50 text-amber-700 border-amber-200",
  PURCHASE_STARTED: "bg-blue-50 text-blue-700 border-blue-200",
  PURCHASE_CANCELED: "bg-red-50 text-red-700 border-red-200",
  ORDER_COMPLETED: "bg-green-50 text-green-700 border-green-200",
  PRODUCT_ENABLED: "bg-teal-50 text-teal-700 border-teal-200",
  PRODUCT_DISABLED: "bg-gray-100 text-gray-600 border-gray-200",
  PRODUCT_CREATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PRODUCT_EDITED: "bg-violet-50 text-violet-700 border-violet-200",
  PRODUCT_DELETED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_BADGE: Record<ShopAuditStatus, string> = {
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELED: "bg-gray-100 text-gray-600 border-gray-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const ACTION_OPTIONS: { value: ShopAuditActionType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All actions" },
  ...(Object.keys(ACTION_LABELS) as ShopAuditActionType[]).map((a) => ({
    value: a,
    label: ACTION_LABELS[a],
  })),
];

const STATUS_OPTIONS: { value: ShopAuditStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELED", label: "Canceled" },
  { value: "FAILED", label: "Failed" },
];

const ROLE_OPTIONS: { value: ShopAuditRole | "ALL"; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-sm font-bold ${className}`}
    >
      {children}
    </span>
  );
}

const selectClass =
  "rounded-xl border border-gray-200 bg-white px-3 py-2 text-base text-secondary outline-none focus:border-secondary transition-colors";

//  Component

export default function AuditLogs() {
  const {
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
    pageSize,
    refetch,
  } = useShopAuditLogs();

  // Local search box state so typing doesn't fire a query on every keystroke.
  const [searchInput, setSearchInput] = useState(filters.search);

  const submitSearch = () => setFilters({ search: searchInput });

  const hasActiveFilters =
    filters.search !== "" ||
    filters.actionType !== "ALL" ||
    filters.actorRole !== "ALL" ||
    filters.status !== "ALL" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.productId !== "";

  const handleClear = () => {
    setSearchInput("");
    clearFilters();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-6">
        <h2 className="text-2xl font-extrabold text-secondary">Shop Audit Logs</h2>
        <span className="text-base font-semibold text-secondary">{total} records</span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[var(--color-container-border)] bg-white p-4 mb-5 space-y-3">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Search by user, email, product name or product ID..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2 text-base text-secondary outline-none focus:border-secondary transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  setFilters({ search: "" });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-secondary hover:text-secondary"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={submitSearch}
            className="rounded-xl bg-secondary px-4 py-2 text-base font-bold text-white hover:bg-secondary/90 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Selects row */}
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">Action</span>
            <select
              value={filters.actionType}
              onChange={(e) => setFilters({ actionType: e.target.value as ShopAuditActionType | "ALL" })}
              className={selectClass}
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">Role</span>
            <select
              value={filters.actorRole}
              onChange={(e) => setFilters({ actorRole: e.target.value as ShopAuditRole | "ALL" })}
              className={selectClass}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">Status</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value as ShopAuditStatus | "ALL" })}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">From</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className={selectClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">To</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className={selectClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">Product ID</span>
            <input
              type="number"
              value={filters.productId}
              onChange={(e) => setFilters({ productId: e.target.value })}
              placeholder="e.g. 42"
              className={`${selectClass} w-28`}
            />
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-base font-bold text-secondary hover:border-red-300 hover:text-red-500 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content states */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl border border-[var(--color-container-border)] bg-gray-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-base font-semibold text-red-600">{error}</p>
          <button
            onClick={() => void refetch()}
            className="mt-3 rounded-xl bg-secondary px-4 py-2 text-base font-bold text-white hover:bg-secondary/90"
          >
            Retry
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-container-border)] bg-white py-16 text-center">
          <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-gray-500" />
          <p className="mt-3 text-base font-semibold text-secondary">No audit logs found.</p>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="mt-3 text-base font-bold text-secondary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-[var(--color-container-border)] bg-white">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-sm uppercase tracking-widest text-secondary">
                  <th className="px-4 py-3 font-bold">When</th>
                  <th className="px-4 py-3 font-bold">Actor</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-secondary tabular-nums">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-secondary">{log.actorName}</p>
                      {log.actorEmail && <p className="text-sm text-secondary">{log.actorEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          log.actorRole === "ADMIN"
                            ? "bg-secondary text-white border-secondary"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }
                      >
                        {log.actorRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={ACTION_BADGE[log.actionType]}>
                        {ACTION_LABELS[log.actionType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {log.productName ? (
                        <span className="text-secondary">
                          {log.productName}
                          {log.productId != null && (
                            <span className="ml-1 text-sm text-secondary">#{log.productId}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_BADGE[log.status]}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[16rem] truncate text-secondary" title={log.details ?? ""}>
                      {log.details ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-[var(--color-container-border)] bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge className={ACTION_BADGE[log.actionType]}>{ACTION_LABELS[log.actionType]}</Badge>
                  <span className="text-sm text-secondary tabular-nums">{formatDate(log.createdAt)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="font-bold text-secondary text-base">{log.actorName}</p>
                  <Badge
                    className={
                      log.actorRole === "ADMIN"
                        ? "bg-secondary text-white border-secondary"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }
                  >
                    {log.actorRole}
                  </Badge>
                  <Badge className={STATUS_BADGE[log.status]}>{log.status}</Badge>
                </div>
                {log.actorEmail && <p className="text-sm text-secondary">{log.actorEmail}</p>}
                {log.productName && (
                  <p className="mt-1 text-base text-secondary">
                    {log.productName}
                    {log.productId != null && <span className="ml-1 text-sm text-secondary">#{log.productId}</span>}
                  </p>
                )}
                {log.details && <p className="mt-1 text-sm text-secondary">{log.details}</p>}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-base text-secondary">
              Page {page + 1} of {pageCount} · {pageSize} per page
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-base font-bold text-secondary hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" /> Prev
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
                disabled={page >= pageCount - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-base font-bold text-secondary hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
