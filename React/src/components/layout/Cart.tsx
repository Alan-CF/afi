import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CartItem from "../ui/shop/CartItem";
import { useCart, startCheckout } from "../../hooks/useCart";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

function CartSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-24 w-24 rounded bg-gray-300" />
      <div className="flex flex-col gap-2">
        <div className="h-6 w-48 rounded bg-gray-300" />
        <div className="h-4 w-64 rounded bg-gray-300" />
      </div>
    </div>
  );
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const {
    cartItems,
    loading: loadingCart,
    error: cartError,
  } = useCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * (1 - (item.discount || 0) / 100),
    0
  );

  const handleCheckout = async () => {
    setCheckingOut(true);
    setCheckoutMsg(null);
    try {
      await startCheckout();
      setCheckoutMsg({ ok: true, text: "Purchase started! We logged your checkout." });
    } catch (err) {
      setCheckoutMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Could not start checkout.",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  useEffect(() => {
    const { body, documentElement } = document;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlOverflow = documentElement.style.overflow;

    if (isOpen) {
      body.style.overflow = "hidden";
      documentElement.style.overflow = "hidden";
    }

    return () => {
      body.style.overflow = originalBodyOverflow;
      documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close shopping cart"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <aside className="absolute inset-0 flex h-full flex-col overflow-hidden bg-white md:inset-y-0 md:right-0 md:left-auto md:w-full md:max-w-md md:border-l md:border-black/10 md:shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <h2 className="text-2xl font-anton font-semibold md:text-3xl">Shopping Cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-black transition-colors hover:bg-black/5"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          {loadingCart ? (
            <div className="flex flex-col gap-4 p-6">
              <CartSkeleton />
              <CartSkeleton />
              <CartSkeleton />
            </div>
          ) : cartError ? (
            <div className="flex min-h-full items-center justify-center px-6 text-center font-lato text-lg text-red-600">
              Error loading cart. Please try again.
            </div>
          ) : cartItems.length > 0 ? (
            <div className="flex flex-col gap-4 p-6">
              {cartItems.map((item) => (
                <CartItem key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-full items-center justify-center px-6 text-center font-lato text-lg text-black/70">
              Your cart is empty for now.
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-black/10 px-6 py-5 space-y-3">
            <div className="flex items-center justify-between font-lato">
              <span className="text-lg font-semibold text-black/70">Total</span>
              <span className="text-2xl font-anton text-black tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            {checkoutMsg && (
              <p
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  checkoutMsg.ok
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {checkoutMsg.text}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full rounded-xl bg-secondary px-4 py-3 font-lato text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
            >
              {checkingOut ? "Starting..." : "Checkout"}
            </button>
          </div>
        )}

      </aside>
    </div>
  );
}
