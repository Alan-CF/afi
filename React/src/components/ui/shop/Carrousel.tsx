import type { ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface ShopCarouselProps {
  children: ReactNode;
}

export default function ShopCarousel({ children }: ShopCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    dragFree: true,
    align: "start",
  });

  return (
    <div className="overflow-hidden px-4 pb-4" ref={emblaRef}>
      <div className="flex">
        {children}
      </div>
    </div>
  );
}