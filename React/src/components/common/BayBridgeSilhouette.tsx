export default function BayBridgeSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 120" className={className} preserveAspectRatio="xMidYEnd slice" aria-hidden>
      <rect x="220" y="20" width="6" height="100" fill="currentColor" />
      <rect x="270" y="20" width="6" height="100" fill="currentColor" />
      <path d="M 220 20 L 248 5 L 276 20 Z" fill="currentColor" />
      <path d="M 0 90 Q 248 30, 600 90" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="600" y="20" width="6" height="100" fill="currentColor" />
      <rect x="650" y="20" width="6" height="100" fill="currentColor" />
      <path d="M 600 20 L 628 5 L 656 20 Z" fill="currentColor" />
      <path d="M 600 90 Q 900 30, 1200 90" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="0" y="100" width="1200" height="3" fill="currentColor" />
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={i * 40 + 10} y1="100" x2={i * 40 + 10} y2={70 + Math.abs(Math.sin(i * 0.5)) * 20} stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      ))}
    </svg>
  );
}
