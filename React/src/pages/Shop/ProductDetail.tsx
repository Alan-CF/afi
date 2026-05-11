import ProductView from '../../components/ui/shop/ProductView';
import { useParams } from 'react-router-dom';
import { useDetailedProduct } from '../../hooks/useShopProducts';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const parsedProductId = productId ? Number(productId) : Number.NaN;
  const productIdNumber = Number.isFinite(parsedProductId)
    ? parsedProductId
    : null;

  const { product, loading, error } = useDetailedProduct(productIdNumber);

  return (
    <ProductView
      imageUrls={product?.imageUrls}
      name={product?.name}
      description={product?.description}
      price={product?.price}
      discount={product?.discount}
      productDetails={product?.product_details}
      loading={loading}
      error={error}
    />
  );
}
