"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";

/**
 * "Reserved for MM:SS" countdown for one cart line — the item's hold on
 * stock lapses server-side at reservedUntil (see lib/cartReservation.ts).
 * Ticks locally every second rather than polling; once it reaches zero it
 * calls onExpire so the panel re-fetches and the (now server-side-released)
 * item actually disappears instead of sitting at "0:00" looking reserved.
 */
function ReservationCountdown({ reservedUntil, onExpire }: { reservedUntil: string | null; onExpire: () => void }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!reservedUntil) {
      setRemainingMs(null);
      return;
    }
    // MySQL DATETIME string ("YYYY-MM-DD HH:MM:SS") has no timezone suffix;
    // swapping the space for "T" gets a format every JS engine parses as
    // local time, matching how it was written.
    const target = new Date(reservedUntil.replace(" ", "T")).getTime();
    const tick = () => {
      const diff = target - Date.now();
      setRemainingMs(diff);
      if (diff <= 0) onExpire();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reservedUntil, onExpire]);

  if (remainingMs === null || remainingMs <= 0) return null;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isUrgent = remainingMs < 2 * 60 * 1000;

  return (
    <span className={`text-[11px] font-semibold ${isUrgent ? "text-red-500" : "text-slate-400"}`}>
      {t("cart.reservedFor")} {minutes}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

/** Faithful port of Medical_Product/src/components/Cart/Cart.jsx. */
export default function CartPanel() {
  const { cartItems, activePanel, closePanel, updateCartQty, removeFromCart, refreshCart } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const isOpen = activePanel === "cart";
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div
      className={`flex flex-col justify-between gap-5 fixed top-0 right-0 bottom-0 z-[220] w-full max-w-[400px] border-l border-zinc-300 py-7 transform transition-transform duration-300 bg-white ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="px-10">
        <h3 className="text-3xl font-bold text-zinc-800 text-center">{t("cart.yourCart")}</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="px-10 py-12 text-center text-zinc-500">{t("cart.empty")}</div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-white px-5 py-3 border-y border-zinc-200">
              <div className="relative w-16 h-16 shrink-0">
                {item.image_url && <Image src={item.image_url} fill sizes="64px" className="object-contain" alt={item.name} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-zinc-800 text-sm">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.medicineId)}
                    className="w-8 h-8 bg-red-600 rounded-full text-white flex justify-center items-center"
                  >
                    <FaTrash />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>{item.price.toLocaleString()} MMK</span>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => updateCartQty(item.medicineId, item.quantity - 1)}
                      className="w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] active:bg-blue-700"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      // This item's own qty already counts toward reserved_qty, so the
                      // room left to grow into is stock_qty - reserved_qty + this qty.
                      disabled={item.quantity >= item.stock_qty - item.reserved_qty + item.quantity}
                      onClick={() => updateCartQty(item.medicineId, item.quantity + 1)}
                      className="w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
                <div className="mt-1.5">
                  <ReservationCountdown reservedUntil={item.reservedUntil} onExpire={refreshCart} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-10 border-y border-zinc-300">
        <div className="flex justify-between pt-2">
          <span className="text-zinc-800">{t("cart.subtotal")}</span>
          <span className="text-zinc-800">{subtotal.toLocaleString()} MMK</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-zinc-800">{t("cart.shippingHandling")}</span>
          <span className="text-zinc-800">0 MMK</span>
        </div>
        <div className="flex justify-between py-2 border-t border-zinc-300">
          <span className="text-lg text-blue-600 font-bold">{t("cart.orderTotal")}</span>
          <span className="text-lg text-blue-600 font-bold">{subtotal.toLocaleString()} MMK</span>
        </div>
      </div>

      <div className="flex gap-x-2 px-10">
        <button className="bg-blue-600 text-white flex-1 h-14 rounded active:bg-blue-700" onClick={closePanel}>
          {t("cart.close")}
        </button>
        <button
          disabled={cartItems.length === 0}
          onClick={() => {
            closePanel();
            router.push("/checkout");
          }}
          className="bg-blue-600 text-white flex-1 h-14 rounded active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {t("cart.checkout")}
        </button>
      </div>
    </div>
  );
}
