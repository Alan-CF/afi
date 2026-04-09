import { useState } from "react";
import { addItemToCart } from "../../../hooks/useCart";
import { type PricedProduct } from "../../../hooks/useShopProducts";

export default function ProductCard({ product }: { product: PricedProduct }) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      setAddToCartError(null);
      await addItemToCart(product.id);
    } catch (error) {
      setAddToCartError(
        error instanceof Error ? error.message : "Failed to add item to cart.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="h-48 w-full overflow-hidden rounded-xl bg-gray-100">
        <img
          src={product.image_url ?? undefined}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.description}</p>
        <p className="text-xl font-bold text-black">${product.price.toFixed(2)}</p>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="mt-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAddingToCart ? "Adding..." : "Add to cart"}
        </button>
        {addToCartError ? (
          <p className="text-sm text-red-600">{addToCartError}</p>
        ) : null}
      </div>
    </div>
  );
}
