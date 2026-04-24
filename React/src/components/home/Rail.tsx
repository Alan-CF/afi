import { useRef, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

interface RailProps {
  title: string;
  seeAllTo?: string;
  children: ReactNode;
  edgeBleed?: boolean;
}

export default function Rail({ title, seeAllTo, children, edgeBleed = true }: RailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function scroll(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  }

  return (
    <section aria-label={title}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
          {title}
          {seeAllTo && (
            <button
              type="button"
              onClick={() => navigate(seeAllTo)}
              className="ml-3 inline-block align-middle font-anton text-xl text-secondary hover:text-primary transition-colors"
              aria-label={`See all ${title}`}
            >
              →
            </button>
          )}
        </h2>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-container-border bg-white text-secondary hover:bg-secondary hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-container-border bg-white text-secondary hover:bg-secondary hover:text-white transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-20 hidden md:block z-10"
          style={{ background: "linear-gradient(to right, transparent, var(--color-text-light-soft))" }}
        />
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide ${
            edgeBleed ? "-mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
