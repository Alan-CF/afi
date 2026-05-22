import { useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import AvatarFrame from "./AvatarFrame";

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  frameId: string;
  frameName: string;
  busy?: boolean;
  onUseNow: () => void;
  onClose: () => void;
}

export default function PurchaseSuccessModal({
  isOpen,
  frameId,
  frameName,
  busy = false,
  onUseNow,
  onClose,
}: PurchaseSuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, busy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onClose} />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col items-center gap-3 bg-success/10 px-6 pt-6 pb-4">
          <CheckCircleIcon className="h-10 w-10 text-success" />
          <h2 className="font-anton text-2xl text-success-dark">Frame Obtained!</h2>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4">
          <AvatarFrame frameId={frameId} size={96} scale={1.3}>
            <div className="h-24 w-24 rounded-full bg-secondary" />
          </AvatarFrame>
          <h3 className="font-anton text-xl text-secondary">{frameName}</h3>
          <p className="text-center font-lato text-sm text-text">
            Added to your inventory. Equip it now or save it for later.
          </p>
        </div>

        <footer className="flex flex-col gap-2 border-t border-container-border px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-secondary px-4 py-2 font-lato text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary hover:text-white disabled:opacity-50"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onUseNow}
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2 font-lato text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Applying…" : "Use Now"}
          </button>
        </footer>
      </div>
    </div>
  );
}
