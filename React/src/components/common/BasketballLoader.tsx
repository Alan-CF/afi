import { useEffect, useState } from "react";
import { LOADING_MESSAGES } from "../../constants/loadingMessages";

type Props = { messageGroup?: keyof typeof LOADING_MESSAGES; size?: "sm" | "md" | "lg" };

export default function BasketballLoader({ messageGroup = "generic", size = "md" }: Props) {
  const [idx, setIdx] = useState(0);
  const messages = LOADING_MESSAGES[messageGroup];

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 2000);
    return () => clearInterval(t);
  }, [messages.length]);

  const dim = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-16 w-16" }[size];
  const txt = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg viewBox="0 0 100 100" className={`${dim} animate-spin`} style={{ animationDuration: "1.6s" }} aria-hidden>
        <circle cx="50" cy="50" r="44" fill="#FFC72C" stroke="#1D428A" strokeWidth="3" />
        <line x1="6" y1="50" x2="94" y2="50" stroke="#1D428A" strokeWidth="3" />
        <path d="M 50 6 Q 22 50, 50 94" stroke="#1D428A" strokeWidth="3" fill="none" />
        <path d="M 50 6 Q 78 50, 50 94" stroke="#1D428A" strokeWidth="3" fill="none" />
      </svg>
      <p className={`font-lato ${txt} text-text-light animate-pulse`}>{messages[idx]}…</p>
    </div>
  );
}
