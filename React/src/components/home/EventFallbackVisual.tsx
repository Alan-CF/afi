export default function EventFallbackVisual() {
  return (
    <div className="absolute inset-0 bg-secondary overflow-hidden">
      <svg
        viewBox="0 0 400 500"
        className="absolute inset-0 h-full w-full text-white opacity-[0.05]"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="20" y="20" width="360" height="460" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M 80 20 Q 80 200, 200 200 Q 320 200, 320 20" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="140" y="20" width="120" height="120" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="200" cy="140" r="50" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        <circle cx="200" cy="32" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="170" y1="20" x2="230" y2="20" stroke="currentColor" strokeWidth="3" />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-anton text-primary opacity-[0.15] select-none leading-none"
        style={{ fontSize: "clamp(5rem, 18vw, 10rem)" }}
        aria-hidden
      >
        AFI
      </span>
    </div>
  );
}
