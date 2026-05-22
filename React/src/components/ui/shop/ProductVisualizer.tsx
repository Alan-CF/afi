import { useState } from 'react';

interface ProductVisualizerProps {
  imageUrls: string[];
  loading?: boolean;
  error?: Error | null;
}

export default function ProductVisualizer({
  imageUrls,
}: ProductVisualizerProps) {
  const [clickedImage, setClickedImage] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  if (!imageUrls || imageUrls.length === 0) {
    return <div className="w-full h-96 bg-gray-200 rounded-lg" />;
  }

  const baseImage =
    clickedImage && imageUrls.includes(clickedImage)
      ? clickedImage
      : imageUrls[0];
  const mainImage =
    hoveredImage && imageUrls.includes(hoveredImage) ? hoveredImage : baseImage;

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
      <div className="flex gap-2" onMouseLeave={() => setHoveredImage(null)}>
        {imageUrls.map((url, index) => {
          const isSelected = url === mainImage;

          return (
            <button
              key={`${url}-${index}`}
              type="button"
              onMouseEnter={() => setHoveredImage(url)}
              onClick={() => setClickedImage(url)}
              className={`h-24 w-24 overflow-hidden rounded-lg bg-gray-100 border-2 transition-colors ${
                isSelected ? 'border-secondary' : 'border-transparent'
              }`}
            >
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
