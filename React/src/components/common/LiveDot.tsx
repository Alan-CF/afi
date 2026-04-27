type LiveDotProps = { size?: "sm" | "md" | "lg"; className?: string };

export default function LiveDot({ size = "md", className = "" }: LiveDotProps) {
  const d = { sm: "h-1.5 w-1.5", md: "h-2 w-2", lg: "h-3 w-3" }[size];
  return (
    <span className={`relative inline-flex ${d} ${className}`} aria-hidden>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75`} />
      <span className={`relative inline-flex ${d} rounded-full bg-live`} />
    </span>
  );
}
