import { useAddItemToCart } from "../../../hooks/useCart";
import { type PricedProduct } from "../../../hooks/useShopProducts";
import Button from "../Button";

export default function ProductCard({ product }: { product: PricedProduct }) {
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
    <div className="flex h-full w-full min-w-60 max-w-96 flex-col gap-4 rounded-xl bg-white p-4 shadow-lg">
      <div className="h-48 w-full overflow-hidden rounded-xl bg-gray-100">
        <img
          src={product.image_url ?? undefined}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 min-h-10 text-lg font-bold font-lato  leading-7">
          {product.name}
        </h3>
        <p className="line-clamp-3 min-h-10 text-sm font-lato ">
          {product.description}
        </p>
        {hasDiscount ? (
          <div className="mt-auto flex items-center gap-2 text-sm">
            <span className="text-xl font-bold font-lato">
              {formattedDiscountedPrice}
            </span>
            <span className="font-lato text-gray-400 line-through">
              {formattedPrice}
            </span>
            <span className="font-lato text-md font-bold text-red-600">
              {product.discount * 100}% OFF
            </span>
          </div>
        ) : (
          <p className="mt-auto text-xl font-bold  font-lato">
            {formattedPrice}
          </p>
        )}
        <Button
          variant="primary"
          onClick={() => {
            void addItemToCart(product.id);
          }}
          disabled={isAddingToCart}
          className="text-sm font-semibold"
        >
          <p className="font-lato">
            {isAddingToCart ? "Adding..." : "Add to cart"}
          </p>
        </Button>
        {addToCartError ? (
          <p className="text-sm text-red-600 font-lato">
            {addToCartError.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
