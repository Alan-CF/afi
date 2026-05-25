import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

interface Props {
  isLoggedIn: boolean;
  isAttending: boolean;
  onToggle: () => Promise<void>;
  disabled?: boolean;
}

export default function AttendButton({
  isLoggedIn,
  isAttending,
  onToggle,
  disabled,
}: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="w-full rounded-2xl bg-secondary px-5 py-3 text-center font-lato text-sm font-bold text-white transition-colors hover:bg-[#172b5b] sm:text-base"
      >
        Sign in to attend
      </button>
    );
  }

  async function handleClick() {
    if (busy || disabled) return;
    try {
      setBusy(true);
      setError(null);
      await onToggle();
    } catch (err) {
      console.error("AttendButton:", err);
      setError(
        err instanceof Error ? err.message : "Could not update attendance."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || disabled}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center font-lato text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${
          isAttending
            ? "bg-secondary text-white hover:bg-[#172b5b]"
            : "bg-primary text-secondary hover:bg-[#f3b91d]"
        }`}
      >
        {isAttending && <CheckIcon className="h-4 w-4" />}
        {busy
          ? isAttending
            ? "Removing..."
            : "Attending..."
          : isAttending
          ? "Attending"
          : "Attend"}
      </button>
      {error && (
        <p className="font-lato text-xs text-[#be123c]">{error}</p>
      )}
    </div>
  );
}
