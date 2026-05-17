import { useFrameImage } from "../../hooks/useFrameImage";

interface AvatarFrameProps {
  frameId: string | null | undefined;
  size: number;
  /**
   * Scale of the frame overlay relative to the avatar size. The frame PNGs include
   * transparent padding so 1.25–1.35 looks correct on most designs.
   */
  scale?: number;
  className?: string;
  children: React.ReactNode;
}

export default function AvatarFrame({
  frameId,
  size,
  scale = 1.3,
  className = "",
  children,
}: AvatarFrameProps) {
  const frameUrl = useFrameImage(frameId);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
      {frameUrl ? (
        <img
          src={frameUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute select-none max-w-none"
          style={{
            width: size * scale,
            height: size * scale,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            objectFit: "contain",
          }}
          draggable={false}
        />
      ) : null}
    </div>
  );
}
