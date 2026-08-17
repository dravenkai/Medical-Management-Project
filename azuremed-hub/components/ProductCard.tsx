"use client";

import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";

interface Product {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  selling_price_ks: number;
  stock_qty: number;
  /** Held by other shoppers' unexpired cart reservations — see lib/cartReservation.ts.
   *  Optional/defaults to 0 for any caller not yet passing it through. */
  reserved_qty?: number;
}

/** Faithful port of Medical_Product/src/components/Cards/Cards.jsx (light theme, no dark mode). */
export default function ProductCard({ product }: { product: Product }) {
  const { toggleFavorite, isFavorite, addToCart } = useCart();
  const { t } = useLanguage();
  const availableQty = product.stock_qty - (product.reserved_qty ?? 0);
  const isOutOfStock = availableQty <= 0;
  const favorite = isFavorite(product.id);

  const wishlistPayload = {
    id: product.id,
    name: product.name,
    category: product.category,
    image_url: product.image_url,
    price: product.selling_price_ks,
  };

  return (
    <div className="bg-white p-5 rounded-3xl relative overflow-hidden group transition-all duration-300 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1">
      {isOutOfStock && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 whitespace-nowrap rounded-full bg-red-600 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.03em] text-white shadow-lg">
          {t("product.outOfStock")}
        </div>
      )}

      <button
        type="button"
        onClick={() => toggleFavorite(wishlistPayload)}
        className={`absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-lg shadow-sm ring-1 transition-colors ${
          favorite
            ? "bg-red-50 text-red-500 ring-red-100"
            : "bg-white/90 text-slate-300 ring-slate-100 hover:text-red-500"
        }`}
        aria-label={favorite ? t("product.removeFromWishlist") : t("product.addToWishlist")}
      >
        <FaHeart />
      </button>

      <Link href={`/products/${product.id}`} className="relative z-10 block w-full h-40 mt-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-110"
          />
        )}
      </Link>

      <div className="relative z-10 text-center mt-6">
        <p className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
          {product.category}
        </p>
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-bold text-slate-800 truncate hover:text-blue-600 transition-colors">{product.name}</h3>
        </Link>
        <p className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
          {product.selling_price_ks.toLocaleString()} <span className="text-xs font-bold">MMK</span>
        </p>
        <p
          className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
            isOutOfStock ? "text-red-500" : "text-emerald-600"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-emerald-500"}`} />
          {isOutOfStock ? t("product.outOfStock") : `${availableQty} ${t("product.available")}`}
        </p>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => addToCart(wishlistPayload, 1)}
          className="mt-4 flex w-full items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:scale-[1.02] transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100"
        >
          <FaShoppingCart /> {t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
