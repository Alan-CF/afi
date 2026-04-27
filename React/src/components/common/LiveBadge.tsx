import LiveDot from "./LiveDot";

type LiveBadgeProps = { variant?: "default" | "compact"; label?: string };

export default function LiveBadge({ variant = "default", label = "LIVE" }: LiveBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/95 ${variant === "compact" ? "px-2 py-0.5" : "px-2.5 py-1"}`}>
      <LiveDot size="sm" />
      <span className="font-lato text-[0.62rem] font-bold uppercase tracking-[0.16em] text-live">
        {label}
      </span>
    </span>
  );
}
