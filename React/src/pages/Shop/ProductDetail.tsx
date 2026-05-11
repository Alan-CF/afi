import ProductView from '../../components/ui/shop/ProductView';
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

  const { product, loading, error } = useDetailedProduct(productIdNumber);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    void addItemToCart(product.id, {});
  };

  return (
    <ProductView
      product={product}
      productLoading={loading}
      productError={error}
      onAddToCart={handleAddToCart}
      isAddingToCart={isAddingToCart}
      addToCartError={addToCartError}
    />
  );
}
