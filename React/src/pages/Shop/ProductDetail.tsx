import ProductView from '../../components/ui/shop/ProductView';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDetailedProduct } from '../../hooks/useShopProducts';
import { useAddItemToCart } from '../../hooks/useCart';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const parsedProductId = productId ? Number(productId) : Number.NaN;
  const productIdNumber = Number.isFinite(parsedProductId)
    ? parsedProductId
    : null;

  const { addItemToCart, isAddingToCart, addToCartError } = useAddItemToCart();
  const [selectedDetails, setSelectedDetails] = useState<
    Record<string, string>
  >({});

  const { product, loading, error } = useDetailedProduct(productIdNumber);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    void addItemToCart(product.id, selectedDetails);
  };

  return (
    <ProductView
      product={product}
      productLoading={loading}
      productError={error}
      onAddToCart={handleAddToCart}
      onDetailSelectionChange={setSelectedDetails}
      isAddingToCart={isAddingToCart}
      addToCartError={addToCartError}
    />
  );
}
