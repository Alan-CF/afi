import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import NavBar from "../components/layout/NavBar";
import { usePointLogs } from "../hooks/usePointLogs";
import {
  ClockIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

type SortKey = "points" | "date";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "points", label: "Points" },
];

export default function PointsHistory() {
  const navigate = useNavigate();

    const { logs, loading } = usePointLogs(50);

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;

      if (sortKey === "points") {
        return dir * (a.points - b.points);
      }

      return (
        dir *
        (new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime())
      );
    });
  }, [logs, sortKey, sortDir]);

  return (
    <div className="min-h-screen bg-[#eef3fb]">
      <NavBar />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w flex-col px-3 py-3 sm:px-5 sm:py-6 xl:px-8">

        <section className="rounded-[1.75rem] bg-white/95 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] sm:p-4 lg:p-8">
          {/* Controls */}
          <div className="flex items-center gap-3 pb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ff] text-secondary transition-colors hover:bg-[#dfe9fb]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <p className="font-lato text-[0.7rem] font-bold uppercase tracking-[0.24em] text-secondary/55">
                Activity Log
              </p>
              <h1 className="font-inter text-[2rem] font-semibold leading-[0.92] tracking-[-0.03em] text-[#1f3668]">
                Points History
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  sortKey === key
                    ? "bg-secondary text-white border-secondary"
                    : "bg-transparent text-gray-400 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}

                {sortKey === key && (
                  <span className="text-[10px]">
                    {sortDir === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </button>
            ))}

            <span className="shrink-0 text-xs text-gray-400 ml-auto pl-2">
              {sortedLogs.length} logs
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
            </div>
          )}

          {/* List */}
          <div className="flex flex-col gap-2">
            {!loading && sortedLogs.length === 0 && (
              <p className="text-center text-gray-400 py-10">
                No points earned yet.
              </p>
            )}

            {sortedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-container-border)] shadow-sm p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e0e6f0]">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-secondary">
                    {log.label}
                  </p>

                  <p className="text-xs text-gray-400">
                    {log.description} ·{" "}
                    {new Date(log.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>

                <p className="text-base font-extrabold text-[var(--color-primary)]">
                  +{log.points}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}