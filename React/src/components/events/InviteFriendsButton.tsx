import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import EventQRCode from "./EventQRCode";

interface Props {
  eventPath: string;
  eventTitle?: string;
}

export default function InviteFriendsButton({ eventPath, eventTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedPath = eventPath.startsWith("/") ? eventPath : `/${eventPath}`;
  const url = `${window.location.origin}${normalizedPath}`;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setError(null);
    }
  }, [open]);

  async function handleCopy() {
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center rounded-2xl border-2 border-secondary px-5 py-3 text-center font-lato text-sm font-bold text-secondary transition-colors hover:bg-secondary hover:text-white sm:text-base"
      >
        Invite friends
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-[0_30px_70px_rgba(15,23,42,0.25)]"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-anton text-xl text-secondary leading-tight">
                Share event
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f8fc] text-secondary hover:bg-[#edf3ff]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            {eventTitle && (
              <p className="mt-1 font-lato text-sm text-[#475569]">
                {eventTitle}
              </p>
            )}
            <div className="mt-5 flex justify-center">
              <EventQRCode url={url} size={240} />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-lato text-sm font-bold transition-colors ${
                copied
                  ? "bg-secondary text-white hover:bg-[#172b5b]"
                  : "bg-primary text-secondary hover:bg-[#f3b91d]"
              }`}
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
            {error && (
              <p className="mt-2 font-lato text-xs text-[#be123c]">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
