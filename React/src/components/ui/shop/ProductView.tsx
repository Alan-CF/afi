import ProductVisualizer from './ProductVisualizer';

interface ProductViewProps {
  imageUrls: string[];
  loading?: boolean;
  error?: Error | null;
}

export default function ProductView({
  imageUrls,
  loading,
  error,
}: ProductViewProps) {
  return (
    <div className="flex">
      <ProductVisualizer
        imageUrls={imageUrls}
        loading={loading}
        error={error}
      />
      <div className="flex flex-col gap-4"></div>
    </div>
  );
}
