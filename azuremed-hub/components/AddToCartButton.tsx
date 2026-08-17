"use client";

import { FaShoppingCart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";

interface Product {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
}

export default function AddToCartButton({ product, disabled }: { product: Product; disabled?: boolean }) {
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const { t } = useLanguage();
  const favorite = isFavorite(product.id);

  return (
    <div className="flex gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => addToCart(product, 1)}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-200 hover:scale-105 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        <FaShoppingCart /> {t("product.addToCart")}
      </button>
      <button
        type="button"
        onClick={() => toggleFavorite(product)}
        className={`flex h-[52px] w-[52px] items-center justify-center rounded-full text-xl ring-1 transition-colors ${
          favorite ? "bg-red-50 text-red-500 ring-red-100" : "bg-white text-slate-300 ring-slate-200 hover:text-red-500"
        }`}
        aria-label={favorite ? t("product.removeFromWishlist") : t("product.addToWishlist")}
      >
        <FaHeart />
      </button>
    </div>
  );
}
