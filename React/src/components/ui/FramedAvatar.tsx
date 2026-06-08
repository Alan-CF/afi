import type { ReactNode } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import AvatarFrame from "./AvatarFrame";

interface FramedAvatarProps {
  avatarUrl?: string | null;
  frameId?: string | null;
  size: number;
  scale?: number;
  className?: string;
  ringClassName?: string;
  fallback?: ReactNode;
}

export default function FramedAvatar({
  avatarUrl,
  frameId,
  size,
  scale,
  className = "",
  ringClassName = "",
  fallback,
}: FramedAvatarProps) {
  return (
    <AvatarFrame
      frameId={frameId}
      size={size}
      scale={scale}
      className={className}
    >
      <div
        className={`overflow-hidden rounded-full bg-secondary ${ringClassName}`}
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          fallback ?? <UserCircleIcon className="h-full w-full text-white/70" />
        )}
      </div>
    </AvatarFrame>
  );
}
