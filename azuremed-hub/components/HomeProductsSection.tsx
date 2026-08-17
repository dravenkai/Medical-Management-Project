"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Heading from "@/components/Heading";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

interface Product {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  selling_price_ks: number;
  stock_qty: number;
  reserved_qty: number;
}

const CATEGORIES = [
  "All",
  "Fever, Cough & Cold",
  "Fitness & Supplement",
  "Sexual Wellness",
  "Mother & Child",
  "Traditional Medicine",
  "Personal Care & Equipment",
];

// Filtering still runs against the raw English category value stored in the
// DB (product.category) — this only maps it to a translation key for the
// tab's displayed label, reusing the same nav.* keys the pharmacy dropdown
// already uses so both places stay in sync automatically.
const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  All: "homeProducts.categoryAll",
  "Fever, Cough & Cold": "nav.feverCoughCold",
  "Fitness & Supplement": "nav.fitnessSupplement",
  "Sexual Wellness": "nav.sexualWellness",
  "Mother & Child": "nav.motherChild",
  "Traditional Medicine": "nav.traditionalMedicine",
  "Personal Care & Equipment": "nav.personalCareEquipment",
};

/** Faithful port of Medical_Product/src/components/Products/Products.jsx + Heading.jsx (light theme). */
export default function HomeProductsSection() {
  const [activeTab, setActiveTab] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  // This is a client component fetching its own data (unlike the /products
  // page, which is a Server Component router.refresh() can re-run) — its
  // stock/reserved_qty numbers otherwise only load once on mount and never
  // reflect a cart mutation until a full page reload. Re-fetching whenever
  // cartCount changes keeps this grid's "available" counts in sync with
  // whatever was just reserved/released.
  const { cartCount } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    // Unguarded, this throws an unhandled rejection straight to Next's dev
    // error overlay on any transient network hiccup — a stale product list
    // is a far better failure mode than crashing the homepage.
    fetch("/api/products")
      .then((r) => r.json())
      .then((result) => result.success && setProducts(result.data))
      .catch((error) => console.error("[home-products] fetch failed:", error));
  }, [cartCount]);

  const filtered = activeTab === "All" ? products : products.filter((p) => p.category === activeTab);
  const visible = filtered.slice(0, 8);

  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <Heading highlight={t("homeProducts.highlight")} heading={t("homeProducts.heading")} />

        <div className="flex flex-wrap gap-3 justify-center mt-10">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`px-5 py-2 text-lg rounded-lg cursor-pointer ${
                activeTab === category ? "bg-gradient-to-b from-indigo-400 to-indigo-600 text-white" : "bg-zinc-100"
              }`}
              onClick={() => setActiveTab(category)}
            >
              {t(CATEGORY_LABEL_KEYS[category])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-9 ml-12 mr-12 mt-auto">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mx-12 mt-8 text-center text-slate-500">{t("homeProducts.noProductsInCategory")}</p>
      )}

      <div className="py-10 my-16 mx-auto w-fit mt-0">
        <Link
          href="/products"
          className="bg-gradient-to-b from-indigo-400 to-indigo-500 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-110 hover:bg-gradient-to-l hover:to-indigo-600 transition-all duration-300 cursor-pointer inline-block"
        >
          {t("homeProducts.viewAll")}
        </Link>
      </div>
    </section>
  );
}
