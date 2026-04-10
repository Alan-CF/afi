

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useShopFilters } from "../../../hooks/useShopGroups";

export default function Filters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useShopFilters();

  const hasFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleFilterClick = (group: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    const current = next.get(group);

    if (current === value) {
      next.delete(group);
    } else {
      next.set(group, value);
    }

    setSearchParams(next);
  };

  return (
    <div className="flex max-w-80 self-stretch flex-col gap-4 bg-white p-4">
      <div className="flex items-center justify-between border-b border-black/10  py-5">
          <h2 className="text-2xl font-anton font-semibold md:text-3xl">Filters</h2>
      </div>

      {!hasFilters && (
        <p className="font-lato text-sm text-gray-500">No filters available.</p>
      )}

      {Object.entries(filters).map(([group, values]) => (
        <div key={group} className="flex flex-col gap-2">
          <h4 className="font-lato text-sm font-semibold uppercase text-black">
            {group.replaceAll("_", " ")}
          </h4>

          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const selected = searchParams.get(group) === value;

              return (
                <button
                  key={value}
                  onClick={() => handleFilterClick(group, value)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selected
                      ? "bg-secondary text-primary font-bold"
                      : "border border-gray-300 bg-white text-gray-700 hover:border-black"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
