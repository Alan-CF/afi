export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 py-0.5"
      role="status"
      aria-label="ThunderAI is typing"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-2 w-2 rounded-full bg-secondary/60 animate-bounce"
          style={{ animationDelay: `${dot * 150}ms` }}
        />
      ))}
    </div>
  );
}
