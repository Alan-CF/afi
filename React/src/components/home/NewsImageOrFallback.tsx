import { useEffect, useState } from "react";

interface Props {
  thumbnail: string | null;
  alt: string;
}

export default function NewsImageOrFallback({ thumbnail, alt }: Props) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [thumbnail]);

  if (thumbnail && !broken) {
    return (
      <img
        src={thumbnail}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover image-zoom"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="absolute inset-0 bg-secondary flex items-center justify-center overflow-hidden">
      <span
        className="font-anton text-primary opacity-[0.07] select-none leading-none"
        style={{ fontSize: "clamp(8rem, 28vw, 22rem)" }}
        aria-hidden
      >
        W
      </span>
    </div>
  );
}
