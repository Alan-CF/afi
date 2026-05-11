import ProductView from '../../components/ui/shop/ProductView';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDetailedProduct } from '../../hooks/useShopProducts';
import { useAddItemToCart } from '../../hooks/useCart';

function buildAddSignature(
  productId: number,
  selectedDetails: Record<string, string>
) {
  const normalizedDetails = Object.entries(selectedDetails).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return JSON.stringify([productId, normalizedDetails]);
}

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
  const [lastAddedSignature, setLastAddedSignature] = useState<string | null>(
    null
  );

  const { product, loading, error } = useDetailedProduct(productIdNumber);
  const currentSelectionSignature = product
    ? buildAddSignature(product.id, selectedDetails)
    : null;
  const isAddedToCart =
    currentSelectionSignature !== null &&
    currentSelectionSignature === lastAddedSignature;

  const handleDetailSelectionChange = (selection: Record<string, string>) => {
    setSelectedDetails(selection);
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    const selectionSignature = buildAddSignature(product.id, selectedDetails);

    void addItemToCart(product.id, selectedDetails).then((wasAdded) => {
      setLastAddedSignature(wasAdded ? selectionSignature : null);
    });
  };

  return (
    <ProductView
      product={product}
      productLoading={loading}
      productError={error}
      onAddToCart={handleAddToCart}
      onDetailSelectionChange={handleDetailSelectionChange}
      isAddingToCart={isAddingToCart}
      isAddedToCart={isAddedToCart}
      addToCartError={addToCartError}
    />
  );
}
