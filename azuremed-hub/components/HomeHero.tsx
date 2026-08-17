"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Client component so the hero can react to the language toggle; the
 * category stats themselves are computed server-side in page.tsx and
 * passed down as plain props (still real live-catalog numbers).
 */
export default function HomeHero({ totalProducts, categoryCount }: { totalProducts: number; categoryCount: number }) {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Decorative gradient blobs — purely visual, no layout impact */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[380px] w-[380px] rounded-full bg-indigo-300/25 blur-3xl" />

      <div className="relative min-h-screen max-w-[1400px] mx-auto px-10 flex md:flex-row flex-col items-center pt-36 md:pt-28">
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 text-sm md:text-base px-5 py-2 rounded-full font-semibold shadow-sm ring-1 ring-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            {t("hero.badge")}
          </span>
          <h1 className="md:text-7xl/[1.05] text-5xl/[1.1] font-extrabold mt-6 tracking-tight text-zinc-900">
            {t("hero.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("hero.titleMedical")}
            </span>{" "}
            {t("hero.titleAnd")}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("hero.titlePharmacy")}
            </span>{" "}
            {t("hero.titleSuffix")}
          </h1>
          <p className="text-zinc-600 md:text-lg text-md max-w-[530px] mt-5 mb-8">{t("hero.description")}</p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link
              href="/products"
              className="bg-gradient-to-b from-blue-500 to-blue-600 text-white px-8 py-3.5 rounded-lg md:text-lg text-md hover:scale-105 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-200 inline-block font-semibold"
            >
              {t("hero.browseProducts")}
            </Link>
            <Link
              href="/detect-medicine"
              className="bg-white text-blue-700 px-8 py-3.5 rounded-lg md:text-lg text-md hover:scale-105 transition-all duration-300 shadow-md ring-1 ring-blue-200 inline-block font-semibold"
            >
              {t("hero.tryAiDetection")}
            </Link>
          </div>

          {/* Real stats pulled from the live catalog — not placeholder numbers */}
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <p className="text-3xl font-extrabold text-zinc-900">{totalProducts}+</p>
              <p className="text-sm text-zinc-500 font-medium">{t("hero.statProducts")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-zinc-900">{categoryCount}</p>
              <p className="text-sm text-zinc-500 font-medium">{t("hero.statCategories")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-zinc-900">24/7</p>
              <p className="text-sm text-zinc-500 font-medium">{t("hero.statAi")}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 mt-10 md:mt-0 relative h-[320px] md:h-[420px] w-full">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[70%] w-[70%] rounded-full bg-gradient-to-tr from-blue-200/60 to-indigo-200/60 blur-2xl" />
          </div>
          <Image
            src="/images/hero-medical-supplies.png"
            alt="Medical Inventory and Equipment"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="relative object-contain drop-shadow-2xl brightness-105 hover:scale-105 transition-transform duration-300"
            priority
          />
        </div>
      </div>
    </section>
  );
}
