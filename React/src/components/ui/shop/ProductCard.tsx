import { type PricedProduct } from '../../../hooks/useShopProducts';

interface ProductCardProps {
  product: PricedProduct;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const hasDiscount = product.discount > 0;
  const discountedPrice = product.price * (1 - product.discount);
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);
  const formattedDiscountedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(discountedPrice);

  const productPreview = (
    <>
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
      </div>
    </>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex h-full w-full min-w-60 max-w-96 flex-col gap-4 rounded-xl bg-white p-4 text-left shadow-lg hover:cursor-pointer ${onClick ? 'transition-transform hover:-translate-y-0.5' : 'cursor-default disabled:opacity-100'}`}
    >
      {productPreview}
    </button>
  );
}
