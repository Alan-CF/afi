export default function CourtLinePattern({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 250" className={`${className} text-secondary/15`} aria-hidden preserveAspectRatio="xMidYMid meet">
      <rect x="20" y="20" width="360" height="210" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M 80 20 Q 80 130, 200 130 Q 320 130, 320 20" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="140" y1="20" x2="260" y2="20" stroke="currentColor" strokeWidth="2" />
      <rect x="140" y="20" width="120" height="80" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="200" cy="100" r="40" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="6 4" />
      <line x1="170" y1="20" x2="230" y2="20" stroke="currentColor" strokeWidth="3" />
      <circle cx="200" cy="32" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
