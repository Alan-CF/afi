import { useEffect, useState } from "react";
import { LinkIcon } from "@heroicons/react/24/solid";

interface Props {
  eventPath: string;
}

export default function InviteFriendsButton({ eventPath }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleClick() {
    const normalizedPath = eventPath.startsWith("/")
      ? eventPath
      : `/${eventPath}`;
    const url = `${window.location.origin}${normalizedPath}`;
    try {
      setError(null);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("Copy failed.");
      }
      setCopied(true);
    } catch (err) {
      console.error("InviteFriendsButton:", err);
      setError(err instanceof Error ? err.message : "Could not copy link.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary px-5 py-3 text-center font-lato text-sm font-bold text-secondary transition-colors hover:bg-secondary hover:text-white sm:text-base"
      >
        <LinkIcon className="h-4 w-4" />
        {copied ? "Link copied" : "Invite friends"}
      </button>
      {error && (
        <p className="font-lato text-xs text-[#be123c]">{error}</p>
      )}
    </div>
  );
}
