import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Bloquea el scroll cuando está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      <div className="relative w-full sm:max-w-sm mx-4 sm:mx-auto bg-white rounded-3xl sm:rounded-3xl overflow-hidden shadow-xl">
        {/* Contenido */}
        <div className="px-6 pt-8 pb-4 text-center">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          {message && (
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        <button
          onClick={onConfirm}
          className={`w-full py-4 text-sm font-bold transition-colors ${
            destructive
              ? "text-red-500 hover:bg-red-50"
              : "text-secondary hover:bg-gray-50"
          }`}
        >
          {confirmLabel}
        </button>

        <div className="h-px bg-gray-100" />

        <button
          onClick={onCancel}
          className="w-full py-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}