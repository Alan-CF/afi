import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import AvatarFrame from "./AvatarFrame";

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  frameId: string;
  frameName: string;
  price: number;
  balance: number;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PurchaseConfirmModal({
  isOpen,
  frameId,
  frameName,
  price,
  balance,
  busy,
  onConfirm,
  onCancel,
}: PurchaseConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onCancel, busy]);

  if (!isOpen) return null;

  const canAfford = balance >= price;
  const newBalance = balance - price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onCancel} />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-container-border px-5 py-4">
          <h2 className="font-anton text-lg text-secondary">Confirm Purchase</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-1 text-text-light transition-colors hover:bg-text-light-soft hover:text-secondary disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4">
          <AvatarFrame frameId={frameId} size={96} scale={1.3}>
            <div className="h-24 w-24 rounded-full bg-secondary" />
          </AvatarFrame>
          <h3 className="font-anton text-xl text-secondary">{frameName}</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary font-anton text-[10px] text-secondary">
              e
            </span>
            <span className="font-lato text-sm font-semibold tabular-nums text-secondary">
              {price.toLocaleString()}
            </span>
          </span>
        </div>

        <div className="mx-5 mb-4 rounded-xl bg-text-light-soft p-3 text-center font-lato text-xs text-text">
          <p>
            Balance after: <strong className="tabular-nums text-secondary">{newBalance.toLocaleString()}</strong> e-coins
          </p>
          {!canAfford ? (
            <p className="mt-1 font-semibold text-destructive-dark">
              Not enough e-coins.
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-container-border px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl px-4 py-2 font-lato text-sm font-bold uppercase tracking-wider text-text-light transition-colors hover:bg-text-light-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !canAfford}
            className="rounded-xl bg-primary px-4 py-2 font-lato text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Buying…" : "Confirm Purchase"}
          </button>
        </footer>
      </div>
    </div>
  );
}
