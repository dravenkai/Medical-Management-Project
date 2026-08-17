"use client";

import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

// Same mapping HomeProductsSection/ProductToolbar use — the DB stores the
// raw English category string, this only maps it to a translation key for
// display.
const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  "Fever, Cough & Cold": "nav.feverCoughCold",
  "Fitness & Supplement": "nav.fitnessSupplement",
  "Sexual Wellness": "nav.sexualWellness",
  "Mother & Child": "nav.motherChild",
  "Traditional Medicine": "nav.traditionalMedicine",
  "Personal Care & Equipment": "nav.personalCareEquipment",
};

/**
 * app/(storefront)/products/page.tsx is a Server Component (it queries the
 * DB directly) so it can't call the client-only useLanguage() hook itself —
 * these are small client islands for just the translatable chrome text,
 * same pattern as ProductToolbar.
 */
export function ProductsCatalogBadge() {
  const { t } = useLanguage();
  return <>{t("products.catalog")}</>;
}

export function ProductsTitle({ category }: { category?: string }) {
  const { t } = useLanguage();
  if (!category) return <>{t("products.allProducts")}</>;
  const key = CATEGORY_LABEL_KEYS[category];
  return <>{key ? t(key) : category}</>;
}

export function ProductsFoundBadge({ count }: { count: number }) {
  const { t } = useLanguage();
  return (
    <>
      {count} {t("products.productsFound")}
    </>
  );
}

export function ProductsEmptyState() {
  const { t } = useLanguage();
  return <p className="mt-10 text-slate-500">{t("products.noProductsInCategory")}</p>;
}
