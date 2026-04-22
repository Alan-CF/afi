import useEmblaCarousel from "embla-carousel-react";
import type { PricedProduct } from "../../../hooks/useShopProducts";

export type ProductRecomendation = {
  product: PricedProduct;
  description: string;
};

function ChatProductCard({ product }: { product: PricedProduct }) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  return (
    <article className="flex h-full flex-col gap-2 rounded-lg bg-secondary p-3 text-white">
      <img
        src={product.image_url || "/placeholder-image.jpg"}
        alt={product.name}
        className="h-28 w-full rounded-md object-cover"
      />
      <h3 className="line-clamp-2 text-sm font-bold">{product.name}</h3>
      <p className="line-clamp-2 text-xs opacity-90">{product.description}</p>
      <p className="mt-auto text-sm font-semibold">{formattedPrice}</p>
    </article>
  );
}

interface ChatProductCarrouselProps {
  recommendations: ProductRecomendation[];
}

export default function ChatProductCarrousel({
  recommendations,
}: ChatProductCarrouselProps) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    dragFree: true,
    align: "start",
  });

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {recommendations.map((rec) => (
          <div key={rec.product.id} className="min-w-52 flex-[0_0_13rem]">
            <div className="flex flex-col">
              <ChatProductCard product={rec.product} />
              <p>{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
