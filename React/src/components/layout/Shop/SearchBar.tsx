import type { ReactNode } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import useEmblaCarousel from "embla-carousel-react";

interface SearchBarProps {
  children: ReactNode;
  loading: boolean;
}

export default function SearchBar({ children, loading }: SearchBarProps) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    dragFree: true,
    align: "start",
  });

  return (
    !loading && (
    <div className="relative py-2">
      
        <div className="absolute inset-y-0 right-0 z-10 flex items-center">
          <button
            type="button"
            aria-label="Search products"
            className=" bg-white h-full px-3 text-black transition-colors hover:bg-black hover:text-white"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      

      <div className="overflow-hidden px-2" ref={emblaRef}>
        <div className="flex items-center gap-3">
          {children}
        </div>
      </div>
    </div>
    )
  );
}
