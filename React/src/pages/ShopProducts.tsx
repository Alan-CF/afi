import useShopProducts from "../hooks/useShopProducts";
import ProductCard from "../components/ui/shop/ProductCard";
import NavBar from "../components/layout/NavBar";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import Filters from "../components/layout/Shop/Filters";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function ProductsSkeleton() {
  return (
    <div className="w-full min-w-60 max-w-96 animate-pulse">
      <div className="h-48 w-full rounded-xl bg-gray-300" />
      <div className="mt-4 h-6 w-3/4 rounded bg-gray-300" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-300" />
    </div>
  );
}

export default function ShopProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("search") || "");
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);

  const handleClearSearch = () => {
    setInputValue("");
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("search");
    setSearchParams(nextSearchParams);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = inputValue.trim();
      if (value) {
        setSearchParams({ search: value });
      } else {
        setSearchParams({});
      }
    }
  };

  const filters = useMemo(() => {
    const nextFilters: Record<string, { name?: string | null }> = {};

    for (const [key, value] of searchParams.entries()) {
      if (key === "search") continue;
      
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        continue;
      }

      nextFilters[key] = { name: trimmedValue };
    }

    return nextFilters;
  }, [searchParams]);

  const searchQuery = useMemo(() => {
    return searchParams.get("search") || "";
  }, [searchParams]);
  
  const { 
    products, 
    loading: productsLoading,
    error: productsError 
  } = useShopProducts({ searchQuery, filters });

  return (
    <div className="flex min-h-screen flex-col bg-secondary/15">
      <NavBar />
      <div className="flex flex-1 items-stretch">
        <div className="hidden md:flex">
          <Filters className="h-full" />
        </div>
        <div className="flex-1">
          <div className="mt-6 flex w-full items-center gap-2 px-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-2xl border-4 border-secondary bg-white px-4 py-3 pr-12 font-lato transition-colors focus:border-primary focus:outline-none disabled:opacity-50"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {inputValue ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition-colors hover:text-primary"
                  onClick={handleClearSearch}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Open filters"
              className="inline-flex items-center justify-center rounded-2xl border-4 border-secondary bg-white p-3 text-black transition-colors hover:border-primary hover:text-primary md:hidden"
              onClick={() => setIsFiltersDrawerOpen(true)}
            >
              <AdjustmentsHorizontalIcon className="h-6 w-6" />
            </button>
      </div>
      {productsLoading ? (
        <div className="grid auto-rows-fr grid-cols-[repeat(auto-fit,minmax(theme(spacing.60),1fr))] gap-6 p-6">
          <ProductsSkeleton />
          <ProductsSkeleton />
          <ProductsSkeleton />
        </div>
      ) : productsError ? (
        <div className="flex items-center justify-center px-6 py-10 text-center font-lato text-lg text-red-600">
          Error loading products. Please try again.
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center px-6 py-10 text-center font-lato text-lg text-gray-700">
          {searchQuery
            ? `No products found for "${searchQuery}".`
            : "No products available at the moment."}
        </div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-[repeat(auto-fit,minmax(theme(spacing.60),1fr))] gap-6 p-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
        </div>
      </div>

      {isFiltersDrawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsFiltersDrawerOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl">
            <div className="h-full overflow-y-auto pt-4">
              <Filters
                className="max-w-none"
                onClose={() => setIsFiltersDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
      
    </div>
  );
}
