"use client";

import Image from "next/image";
import { FaTrash } from "react-icons/fa";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";

/** Faithful port of Medical_Product/src/components/Wishlist.jsx/Wishlist.jsx. */
export default function WishlistPanel() {
  const { wishlistItems, activePanel, closePanel, removeFromWishlist, clearWishlist, addToCart } = useCart();
  const { t } = useLanguage();
  const isOpen = activePanel === "wishlist";

  return (
    <div
      className={`flex flex-col justify-between gap-5 fixed top-0 right-0 bottom-0 z-[220] w-full max-w-[400px] border-l border-zinc-300 py-7 transform transition-transform duration-300 bg-white ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="px-10">
        <h3 className="text-3xl font-bold text-zinc-800 text-center">{t("wishlist.yourWishlist")}</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {wishlistItems.length === 0 ? (
          <div className="px-10 py-12 text-center text-zinc-500">{t("wishlist.empty")}</div>
        ) : (
          wishlistItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-white px-5 py-3 border-y border-zinc-200">
              <div className="relative w-16 h-16 shrink-0">
                {item.image_url && <Image src={item.image_url} fill sizes="64px" className="object-contain" alt={item.name} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-zinc-800 text-sm">{item.name}</h4>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="w-8 h-8 bg-red-600 rounded-full text-white flex justify-center items-center"
                  >
                    <FaTrash />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>{item.price.toLocaleString()} MMK</span>
                  <button
                    type="button"
                    onClick={() => addToCart(item, 1)}
                    className="bg-blue-600 text-white text-sm px-4 py-1 rounded-full active:bg-blue-700"
                  >
                    {t("product.addToCart")}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-x-2 px-10">
        <button className="bg-blue-600 text-white flex-1 h-14 rounded active:bg-blue-700" onClick={closePanel}>
          {t("cart.close")}
        </button>
        <button
          type="button"
          onClick={clearWishlist}
          disabled={wishlistItems.length === 0}
          className="bg-blue-600 text-white flex-1 h-14 rounded active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {t("wishlist.clearAll")}
        </button>
      </div>
    </div>
  );
}
