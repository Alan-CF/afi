import useEmblaCarousel from "embla-carousel-react";
import { useAddItemToCart } from "../../../hooks/useCart";
import type { PricedProduct } from "../../../hooks/useShopProducts";
import Button from "../Button";

export type ProductRecomendation = {
  product: PricedProduct;
  description: string;
};

function ChatProductCard({ product }: { product: PricedProduct }) {
  const { addItemToCart, isAddingToCart, addToCartError } = useAddItemToCart();
  const hasDiscount = product.discount > 0;
  const discountedPrice = product.price * (1 - product.discount);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);
  const formattedDiscountedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(discountedPrice);

  return (
    <article className="flex h-[310px] flex-col gap-2 rounded-lg bg-secondary p-3 text-white">
      <img
        src={product.image_url || "/placeholder-image.jpg"}
        alt={product.name}
        className="h-28 w-full rounded-md object-cover"
      />
      <h3 className="line-clamp-2 text-sm font-bold">{product.name}</h3>
      <p className="line-clamp-2 text-xs opacity-90">{product.description}</p>
      {hasDiscount ? (
        <div className="mt-auto flex items-center gap-2 text-sm">
          <span className="font-semibold">{formattedDiscountedPrice}</span>
          <span className="line-through opacity-70">{formattedPrice}</span>
          <span className="font-bold text-primary">
            {product.discount * 100}% OFF
          </span>
        </div>
      ) : (
        <p className="mt-auto text-sm font-semibold">{formattedPrice}</p>
      )}
      <Button
        variant="primary"
        className="w-full rounded-lg"
        onClick={() => {
          void addItemToCart(product.id);
        }}
        disabled={isAddingToCart}
      >
        {isAddingToCart ? "Adding..." : "Add to cart"}
      </Button>
      {addToCartError ? (
        <p className="text-xs text-red-400">{addToCartError.message}</p>
      ) : null}
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
    dragFree: false,
    align: "center",
  });

  console.log(
    "Rendering ChatProductCarrousel with recommendations:",
    recommendations,
  );

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {recommendations.map((rec) => (
          <div key={rec.product.id} className="min-w-60 flex-[0_0_13rem]">
            <div className="flex flex-col gap-2">
              <ChatProductCard product={rec.product} />
              <p className="px-2">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
