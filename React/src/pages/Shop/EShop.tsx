import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import { useEshop, type Frame } from "../../hooks/useEshop";
import { useProfile } from "../../hooks/useProfile";
import AvatarFrame from "../../components/ui/AvatarFrame";
import Button from "../../components/ui/Button";

function ECoinPill({ amount, large = false }: { amount: number; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 font-anton font-bold text-secondary ${
        large ? "py-2 text-2xl" : "py-1 text-sm"
      }`}
    >
      <CurrencyDollarIcon className={large ? "h-6 w-6 text-primary" : "h-4 w-4 text-primary"} />
      {amount.toLocaleString()}
    </span>
  );
}

function FrameCard({
  frame,
  owned,
  selected,
  canAfford,
  busy,
  onBuy,
  onSelect,
}: {
  frame: Frame;
  owned: boolean;
  selected: boolean;
  canAfford: boolean;
  busy: boolean;
  onBuy: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border bg-[var(--color-background)] p-4 shadow-sm transition-shadow lift-on-hover ${
        selected ? "border-primary ring-2 ring-primary/40" : "border-[var(--color-container-border)]"
      }`}
    >
      <div className="flex justify-center pt-2 pb-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-secondary/5">
          <AvatarFrame frameId={frame.id} size={88} scale={1.4}>
            <div
              className="flex items-center justify-center rounded-full bg-secondary text-2xl font-extrabold text-white"
              style={{ width: 88, height: 88 }}
            >
              {frame.name.charAt(0)}
            </div>
          </AvatarFrame>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-anton text-lg font-bold uppercase tracking-wide text-secondary">
          {frame.name}
        </h3>
        {owned ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-success">
            <CheckBadgeIcon className="h-4 w-4" /> Owned
          </span>
        ) : (
          <ECoinPill amount={frame.price} />
        )}
      </div>

      {owned ? (
        <Button
          variant={selected ? "primary" : "secondary"}
          className="w-full py-2 text-sm font-bold uppercase"
          onClick={onSelect}
          disabled={busy || selected}
        >
          {selected ? "Equipped" : "Equip"}
        </Button>
      ) : (
        <Button
          variant={canAfford ? "primary" : "secondary"}
          className="w-full py-2 text-sm font-bold uppercase"
          onClick={onBuy}
          disabled={busy || !canAfford}
        >
          {canAfford ? "Buy" : "Not enough e-coins"}
        </Button>
      )}
    </div>
  );
}

export default function EShop() {
  const navigate = useNavigate();
  const { user } = useProfile();
  const {
    frames,
    owned,
    selectedFrameId,
    eCoins,
    loading,
    error,
    purchase,
    selectFrame,
  } = useEshop();

  const [busyFrameId, setBusyFrameId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const showFeedback = (kind: "ok" | "err", text: string) => {
    setFeedback({ kind, text });
    window.clearTimeout((showFeedback as any)._t);
    (showFeedback as any)._t = window.setTimeout(() => setFeedback(null), 2400);
  };

  const handleBuy = async (frameId: string) => {
    setBusyFrameId(frameId);
    const result = await purchase(frameId);
    setBusyFrameId(null);
    if (result.ok) {
      showFeedback("ok", "Frame purchased!");
    } else {
      showFeedback("err", result.reason);
    }
  };

  const handleSelect = async (frameId: string) => {
    setBusyFrameId(frameId);
    const result = await selectFrame(selectedFrameId === frameId ? null : frameId);
    setBusyFrameId(null);
    if (!result.ok) showFeedback("err", "Could not equip frame.");
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-text font-[family-name:var(--font-lato)]">
      <main className="w-full px-4 pb-12 pt-5 md:px-8 lg:px-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-bold text-secondary transition-colors hover:text-secondary/70"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)]">
          <div className="flex flex-col gap-4 bg-secondary px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-anton text-3xl font-bold text-white md:text-4xl">eShop</h1>
              <p className="mt-1 text-sm text-white/80">
                Spend e-coins on profile frames. Earning points also earns e-coins.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 md:items-end">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Your e-coins
              </span>
              <ECoinPill amount={eCoins} large />
            </div>
          </div>
        </section>

        {feedback ? (
          <div
            role="status"
            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${
              feedback.kind === "ok"
                ? "border-success/30 bg-success/10 text-success-dark"
                : "border-destructive/30 bg-destructive/10 text-destructive-dark"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        {!user && !loading ? (
          <p className="rounded-2xl border border-[var(--color-container-border)] bg-[var(--color-text-light-soft)] p-6 text-center text-sm text-gray-500">
            Sign in to browse and buy frames.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive-dark">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-[var(--color-container-border)] bg-[var(--color-text-light-soft)]"
              />
            ))}
          </div>
        ) : frames.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-container-border)] bg-[var(--color-text-light-soft)] p-6 text-center text-sm text-gray-500">
            No frames available yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {frames.map((frame) => {
              const isOwned = owned.has(frame.id);
              const isSelected = selectedFrameId === frame.id;
              return (
                <FrameCard
                  key={frame.id}
                  frame={frame}
                  owned={isOwned}
                  selected={isSelected}
                  canAfford={eCoins >= frame.price}
                  busy={busyFrameId === frame.id}
                  onBuy={() => handleBuy(frame.id)}
                  onSelect={() => handleSelect(frame.id)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
