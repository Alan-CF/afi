interface Props {
  thumbnail: string | null;
  alt: string;
}

export default function NewsImageOrFallback({ thumbnail, alt }: Props) {
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover image-zoom"
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
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
