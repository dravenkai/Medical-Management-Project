"use client";

import Link from "next/link";
import Image from "next/image";
import { FaDumbbell, FaHeart, FaBaby } from "react-icons/fa6";
import type { IconType } from "react-icons";
import Heading from "@/components/Heading";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

// Only 3 pieces of category art exist from the old taxonomy. The other 3
// categories get a generic icon badge instead (CATEGORY_ICON below) so every
// card reserves the same 220px image slot — mixing "has art" and "no art"
// cards in one flex row previously left half the row flush against the top
// while the other half floated its image above, making the row look broken.
const CATEGORY_ART: Record<string, string> = {
  "Fever, Cough & Cold": "/images/categories/english-medicine.png",
  "Traditional Medicine": "/images/categories/myanmar-medicine.png",
  "Personal Care & Equipment": "/images/categories/medical-equipment.png",
};

const CATEGORY_ICON: Record<string, IconType> = {
  "Fitness & Supplement": FaDumbbell,
  "Sexual Wellness": FaHeart,
  "Mother & Child": FaBaby,
};

// row.category is the raw English string stored in the DB — these are the
// same nav.* translation keys the nav bar's category tabs already use for
// this exact set of 6 names (see lib/translations.ts), reused here so the
// card titles switch to Myanmar along with the rest of the page instead of
// staying stuck in English.
const CATEGORY_LABEL_KEY: Record<string, TranslationKey> = {
  "Fever, Cough & Cold": "nav.feverCoughCold",
  "Fitness & Supplement": "nav.fitnessSupplement",
  "Sexual Wellness": "nav.sexualWellness",
  "Mother & Child": "nav.motherChild",
  "Traditional Medicine": "nav.traditionalMedicine",
  "Personal Care & Equipment": "nav.personalCareEquipment",
};

// First Aid/Topical/Vitamins exist in the DB (from later product imports)
// but were never part of the original 6-category taxonomy this section (and
// the homepage/product-toolbar tabs) was designed around — filtered out
// here rather than left to render with no art/icon.
const VISIBLE_CATEGORIES = new Set([
  "Fever, Cough & Cold",
  "Fitness & Supplement",
  "Sexual Wellness",
  "Mother & Child",
  "Traditional Medicine",
  "Personal Care & Equipment",
]);

interface CategoryRow {
  category: string;
  product_count: number;
}

/** Client wrapper (for the language toggle) around the category cards; the row data itself is still fetched server-side in page.tsx. */
export default function CategoriesSection({ categoryRows }: { categoryRows: CategoryRow[] }) {
  const { t } = useLanguage();

  return (
    <section className="max-w-[1400px] mx-auto px-10 py-16">
      <Heading highlight={t("categories.highlight")} heading={t("categories.heading")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-14">
        {categoryRows.filter((row) => VISIBLE_CATEGORIES.has(row.category)).map((row) => {
          const art = CATEGORY_ART[row.category];
          const Icon = CATEGORY_ICON[row.category];
          return (
            <div key={row.category} className="flex flex-col">
              <div className="relative -mb-10 z-10 h-[220px] w-full">
                {art ? (
                  <Image
                    src={art}
                    alt={row.category}
                    width={280}
                    height={200}
                    // className's w-auto overrides the width dimension (so the
                    // image scales by height alone, preserving its real aspect
                    // ratio) — style width:auto mirrors that for Next's own
                    // aspect-ratio inference, which otherwise assumes both the
                    // width and height props are literally being honored.
                    style={{ width: "auto" }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-[200px] w-auto object-contain"
                  />
                ) : (
                  Icon && (
                    <div className="absolute bottom-0 left-1/2 flex h-40 w-40 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Icon className="h-16 w-16 text-blue-500" />
                    </div>
                  )
                )}
              </div>
              <div className="bg-zinc-100 pt-16 p-8 rounded-xl border border-zinc-200 flex-1">
                <h3 className="text-zinc-800 text-2xl font-bold">
                  {CATEGORY_LABEL_KEY[row.category] ? t(CATEGORY_LABEL_KEY[row.category]) : row.category}
                </h3>
                <p className="text-zinc-600 mt-3 mb-6">
                  {row.product_count} {t("categories.productsAvailable")}
                </p>
                <Link
                  href={`/products?category=${encodeURIComponent(row.category)}`}
                  className="inline-block bg-gradient-to-b from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-105 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer shadow-md"
                >
                  {t("categories.viewProducts")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
