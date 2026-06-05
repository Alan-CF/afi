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
  const frameSize = size * scale;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Clip box sized to the frame so nothing (avatar crop or frame art)
          can escape past the frame bounds and leak into the layout. */}
      <div
        className="absolute left-1/2 top-1/2 flex items-center justify-center overflow-hidden rounded-full"
        style={{
          width: frameSize,
          height: frameSize,
          transform: "translate(-50%, -50%)",
        }}
      >
        {children}
        {frameUrl ? (
          <img
            src={frameUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none max-w-none"
            style={{
              width: frameSize,
              height: frameSize,
              objectFit: "contain",
            }}
            draggable={false}
          />
        ) : null}
      </div>
    </div>
  );
}
