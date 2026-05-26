interface Props {
  url: string;
  size?: number;
  alt?: string;
  className?: string;
}

export default function EventQRCode({
  url,
  size = 220,
  alt = "Event QR code",
  className,
}: Props) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&margin=0&qzone=1&color=1f3668&bgcolor=ffffff`;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={
        className ??
        "rounded-2xl border border-container-border bg-white p-2"
      }
    />
  );
}
