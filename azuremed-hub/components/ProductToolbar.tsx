"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FaThermometer, FaDumbbell, FaHeart, FaBaby, FaLeaf, FaKitMedical, FaTableCellsLarge, FaMagnifyingGlass, FaChevronDown, FaCheck, FaXmark } from "react-icons/fa6";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

// Must match the 6 categories products are actually seeded with — see the
// comment above RAW_PRODUCTS in scripts/fullCatalog.js.
const CATEGORY_TABS: Array<{ key: string | null; labelKey: TranslationKey; icon: typeof FaTableCellsLarge }> = [
  { key: null, labelKey: "homeProducts.categoryAll", icon: FaTableCellsLarge },
  { key: "Fever, Cough & Cold", labelKey: "nav.feverCoughCold", icon: FaThermometer },
  { key: "Fitness & Supplement", labelKey: "nav.fitnessSupplement", icon: FaDumbbell },
  { key: "Sexual Wellness", labelKey: "nav.sexualWellness", icon: FaHeart },
  { key: "Mother & Child", labelKey: "nav.motherChild", icon: FaBaby },
  { key: "Traditional Medicine", labelKey: "nav.traditionalMedicine", icon: FaLeaf },
  { key: "Personal Care & Equipment", labelKey: "nav.personalCareEquipment", icon: FaKitMedical },
];

const SORT_OPTIONS = [
  { key: "featured", labelKey: "toolbar.sortFeatured" },
  { key: "newest", labelKey: "toolbar.sortNewest" },
  { key: "name-asc", labelKey: "toolbar.sortNameAsc" },
  { key: "price-asc", labelKey: "toolbar.sortPriceAsc" },
  { key: "price-desc", labelKey: "toolbar.sortPriceDesc" },
] as const satisfies ReadonlyArray<{ key: string; labelKey: TranslationKey }>;

export default function ProductToolbar({
  activeCategory,
  activeSearch,
  activeSort,
}: {
  activeCategory?: string;
  activeSearch?: string;
  activeSort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [searchDraft, setSearchDraft] = useState(activeSearch ?? "");
  const [sortOpen, setSortOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function navigate(next: { category?: string | null; search?: string | null; sort?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeSortLabel = t(SORT_OPTIONS.find((o) => o.key === activeSort)?.labelKey ?? "toolbar.sortFeatured");

  return (
    <div className="flex flex-col gap-4">
      {/* Category pill tabs */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_TABS.map(({ key, labelKey, icon: Icon }) => {
          const isActive = (activeCategory ?? null) === key;
          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => navigate({ category: key })}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className={isActive ? "text-blue-600" : "text-slate-400"} />
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* Search + Sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: searchDraft.trim() || null });
          }}
          className="relative w-full sm:max-w-sm"
        >
          <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t("toolbar.searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none"
          />
          {searchDraft && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                navigate({ search: null });
              }}
              aria-label={t("toolbar.clearSearch")}
              className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <FaXmark className="text-sm" />
            </button>
          )}
        </form>

        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {t("toolbar.sortBy")} <span className="font-bold">{activeSortLabel}</span>
            <FaChevronDown className={`text-xs text-slate-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
              {SORT_OPTIONS.map((option) => {
                const isActive = option.key === activeSort;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      navigate({ sort: option.key === "featured" ? null : option.key });
                      setSortOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t(option.labelKey)}
                    {isActive && <FaCheck className="text-xs" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
