import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import { useEshop, type Frame } from "../../hooks/useEshop";
import { useProfile } from "../../hooks/useProfile";
import AvatarFrame from "../../components/ui/AvatarFrame";

function ECoinPill({
  amount,
  size = "sm",
}: {
  amount: number;
  size?: "sm" | "lg";
}) {
  const large = size === "lg";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-primary/15 ${
        large ? "px-4 py-1.5" : "px-2.5 py-0.5"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-primary font-anton text-secondary ${
          large ? "h-5 w-5 text-xs" : "h-4 w-4 text-[10px]"
        }`}
      >
        e
      </span>
      <span
        className={`font-lato font-semibold tabular-nums text-secondary ${
          large ? "text-base" : "text-xs"
        }`}
      >
        {amount.toLocaleString()}
      </span>
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
  const AVATAR = 96;
  return (
    <div
      className={`flex flex-col rounded-3xl border bg-white p-5 transition-shadow lift-on-hover ${
        selected
          ? "border-primary shadow-md"
          : "border-container-border shadow-sm"
      }`}
    >
      <div className="flex justify-center pt-1 pb-4">
        <AvatarFrame frameId={frame.id} size={AVATAR} scale={1.3}>
          <div
            className="rounded-full bg-secondary"
            style={{ width: AVATAR, height: AVATAR }}
          />

        </AvatarFrame>
      </div>

      <h3 className="font-anton text-base md:text-lg text-secondary leading-tight">
        {frame.name}
      </h3>

      <div className="mt-1 mb-4 flex items-center justify-between">
        {owned ? (
          <span className="inline-flex items-center gap-1 font-lato text-xs font-semibold uppercase tracking-wide text-success-dark">
            <CheckBadgeIcon className="h-4 w-4" /> Owned
          </span>
        ) : (
          <span className="font-lato text-xs text-text">Price</span>
        )}
        {!owned ? <ECoinPill amount={frame.price} /> : <span />}
      </div>

      {owned ? (
        <button
          onClick={onSelect}
          disabled={busy || selected}
          className={`w-full rounded-xl px-4 py-2 font-lato text-xs font-bold uppercase tracking-wider transition-colors ${
            selected
              ? "bg-success/10 text-success-dark cursor-default"
              : "border border-secondary text-secondary hover:bg-secondary hover:text-white"
          } disabled:opacity-60`}
        >
          {selected ? "Equipped" : "Equip"}
        </button>
      ) : (
        <button
          onClick={onBuy}
          disabled={busy || !canAfford}
          className={`w-full rounded-xl px-4 py-2 font-lato text-xs font-bold uppercase tracking-wider transition-colors ${
            canAfford
              ? "bg-primary text-secondary hover:bg-primary-dark"
              : "bg-text-light-soft text-text-light cursor-not-allowed"
          }`}
        >
          {canAfford ? "Buy" : "Not enough"}
        </button>
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
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const showFeedback = (kind: "ok" | "err", text: string) => {
    setFeedback({ kind, text });
    window.clearTimeout((showFeedback as any)._t);
    (showFeedback as any)._t = window.setTimeout(() => setFeedback(null), 2400);
  };

  const handleBuy = async (frameId: string) => {
    setBusyFrameId(frameId);
    const result = await purchase(frameId);
    setBusyFrameId(null);
    if (result.ok) showFeedback("ok", "Frame purchased!");
    else showFeedback("err", result.reason);
  };

  const handleSelect = async (frameId: string) => {
    setBusyFrameId(frameId);
    const result = await selectFrame(
      selectedFrameId === frameId ? null : frameId
    );
    setBusyFrameId(null);
    if (!result.ok) showFeedback("err", "Could not equip frame.");
  };

  return (
    <div className="min-h-screen bg-background text-text font-[family-name:var(--font-lato)]">
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-6 md:px-6 md:pt-8 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 font-lato text-sm font-bold text-secondary transition-colors hover:text-secondary/70"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        <header className="mb-6 flex flex-col gap-4 fade-in-up stagger-1 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-anton text-3xl text-secondary leading-tight md:text-4xl">
              eShop
            </h1>
            <p className="mt-2 font-lato text-sm text-text md:text-base">
              Spend e-coins on profile frames. Earning points also earns
              e-coins.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-lato text-xs font-semibold uppercase tracking-widest text-text">
              Balance
            </span>
            <ECoinPill amount={eCoins} size="lg" />
          </div>
        </header>

        {feedback ? (
          <div
            role="status"
            className={`mb-4 rounded-xl border px-4 py-3 font-lato text-sm ${
              feedback.kind === "ok"
                ? "border-success/30 bg-success/10 text-success-dark"
                : "border-destructive/30 bg-destructive/10 text-destructive-dark"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        {!user && !loading ? (
          <p className="rounded-2xl border border-container-border bg-text-light-soft p-6 text-center font-lato text-sm text-text-light">
            Sign in to browse and buy frames.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 font-lato text-sm font-semibold text-destructive-dark">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl border border-container-border bg-text-light-soft"
              />
            ))}
          </div>
        ) : frames.length === 0 ? (
          <p className="rounded-2xl border border-container-border bg-text-light-soft p-6 text-center font-lato text-sm text-text-light">
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
