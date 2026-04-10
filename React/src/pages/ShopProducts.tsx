import useShopProducts from "../hooks/useShopProducts";
import ProductCard from "../components/ui/shop/ProductCard";
import NavBar from "../components/layout/NavBar";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";

function ProductsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 w-full rounded-xl bg-gray-300" />
      <div className="mt-4 h-6 w-3/4 rounded bg-gray-300" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-300" />
    </div>
  );
}

export default function ShopProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("search") || "");

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

  if (productsLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary/15">
        <NavBar />
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <ProductsSkeleton />
          <ProductsSkeleton />
          <ProductsSkeleton />
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary/15">
        <NavBar />
        <div className="flex items-center justify-center px-6 py-10 text-center font-lato text-lg text-red-600">
          Error loading products. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/15">
      <NavBar />
      <div className="w-full px-6">
        <input
          type="text"
          placeholder="Search products..."
          className="mt-6 w-full bg-white border-4 border-secondary focus:border-primary focus:outline-none rounded-2xl disabled:opacity-50 px-4 py-3 font-lato transition-colors"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>
      <div className="grid auto-rows-fr grid-cols-1 gap-6 p-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
