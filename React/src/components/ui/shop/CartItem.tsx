import type { CartItem as CartItemData } from "../../../hooks/useCart";

export default function CartItem(item: CartItemData) {
  const hasDiscount = item.discount > 0;
  const discountedPrice = item.price * (1- item.discount);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(item.price);
  const formattedDiscountedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(discountedPrice);

  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={item.image_url ?? undefined}
          alt={item.product_name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="text-lg font-semibold">{item.product_name}</h4>
        <p className="truncate text-sm text-gray-500">{item.product_description}</p>
        {hasDiscount ? (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-base font-semibold text-black">{formattedDiscountedPrice}</span>
            <span className="text-gray-400 line-through">{formattedPrice}</span>
            <span className="px-2 py-0.5 text-md font-bold text-red-600">
              {item.discount * 100}% OFF
            </span>
          </div>
        ) : (
          <p className="mt-2 text-base font-semibold text-black">{formattedPrice}</p>
        )}
      </div>
    </div>
  );
}
