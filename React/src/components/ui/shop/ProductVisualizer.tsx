interface ProductVisualizerProps {
  imageUrls: string[];
  loading?: boolean;
  error?: Error | null;
}

export default function ProductVisualizer({
  imageUrls,
}: ProductVisualizerProps) {
  if (!imageUrls || imageUrls.length === 0) {
    return <div className="w-full h-96 bg-gray-200 rounded-lg" />;
  }

  const mainImage = imageUrls[0];
  const thumbnails = imageUrls.slice(1);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Image */}
      <div className="w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
        <img
          src={mainImage}
          alt="Product main"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail Images */}
      {thumbnails.length > 0 && (
        <div className="flex gap-2">
          {thumbnails.map((url, index) => (
            <div
              key={index}
              className="w-full aspect-video overflow-hidden rounded-lg bg-gray-100"
            >
              <img
                src={url}
                alt={`Product ${index + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
