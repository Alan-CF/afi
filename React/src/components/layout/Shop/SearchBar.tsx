import { useState, type ReactNode } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import useEmblaCarousel from "embla-carousel-react";

interface SearchBarProps {
  children: ReactNode;
  loading: boolean;
  onSearch: (query: string) => void;
}

function SearchChipSkeleton() {
  return <div className="h-10 w-28 shrink-0 animate-pulse rounded-full bg-gray-200" />;
}

export default function SearchBar({ children, loading, onSearch }: SearchBarProps) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    dragFree: true,
    align: "start",
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    const query = searchValue.trim();

    if (!query) {
      return;
    }

    onSearch(query);
  };

  return (
    <div className="relative py-2">
      {isSearchOpen ? (
        <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center gap-2 bg-white px-2">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => setIsSearchOpen(false)}
            placeholder="Search products"
            autoFocus
            className="min-w-0 flex-1 px-4 py-2 font-lato text-sm text-black outline-none"
          />
          <button
            type="button"
            aria-label="Close search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsSearchOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-black transition-colors hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="absolute inset-y-0 right-0 z-10 flex items-center">
        <button
          type="button"
          aria-label="Search products"
          className="h-full bg-white px-3 text-black transition-colors hover:bg-primary hover:text-secondary"
          onClick={() => setIsSearchOpen((currentValue) => !currentValue)}
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-hidden px-2" ref={emblaRef}>
        <div className="flex items-center gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SearchChipSkeleton key={index} />
              ))
            : children}
        </div>
      </div>
    </div>
  );
}
