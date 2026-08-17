"use client";

import Image from "next/image";
import Link from "next/link";
import { FaStethoscope, FaFlask, FaShieldVirus, FaCheckDouble, FaMagnifyingGlass, FaCartShopping, FaLock, FaFileInvoice, FaCamera, FaStar } from "react-icons/fa6";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const VALUES: Array<{ titleKey: TranslationKey; paraKey: TranslationKey; icon: React.ReactNode }> = [
  { titleKey: "about.valueQualityTitle", paraKey: "about.valueQualityPara", icon: <FaCheckDouble /> },
  { titleKey: "about.valueSupportTitle", paraKey: "about.valueSupportPara", icon: <FaStethoscope /> },
  { titleKey: "about.valueSafetyTitle", paraKey: "about.valueSafetyPara", icon: <FaShieldVirus /> },
  { titleKey: "about.valueHerbalTitle", paraKey: "about.valueHerbalPara", icon: <FaFlask /> },
];

const HOW_TO_STEPS: Array<{ titleKey: TranslationKey; paraKey: TranslationKey; icon: React.ReactNode }> = [
  { titleKey: "about.step1Title", paraKey: "about.step1Para", icon: <FaMagnifyingGlass /> },
  { titleKey: "about.step2Title", paraKey: "about.step2Para", icon: <FaCartShopping /> },
  { titleKey: "about.step3Title", paraKey: "about.step3Para", icon: <FaLock /> },
  { titleKey: "about.step4Title", paraKey: "about.step4Para", icon: <FaFileInvoice /> },
  { titleKey: "about.step5Title", paraKey: "about.step5Para", icon: <FaCamera /> },
  { titleKey: "about.step6Title", paraKey: "about.step6Para", icon: <FaStar /> },
];

/** New page — the original Medical_Product SPA had no About Us page to port. Copy stays consistent with Footer/ValuesSection's existing claims (no new facts invented). */
export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-20">
      <section className="max-w-[1400px] mx-auto px-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            {t("about.badge")}
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
            {t("about.heading")}
          </h1>
          <p className="mt-5 text-zinc-600 md:text-lg leading-relaxed">{t("about.description")}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="bg-gradient-to-b from-blue-500 to-blue-600 text-white px-7 py-3 rounded-lg font-semibold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
            >
              {t("hero.browseProducts")}
            </Link>
            <Link
              href="/contact"
              className="bg-white text-blue-700 px-7 py-3 rounded-lg font-semibold ring-1 ring-blue-200 shadow-md hover:scale-105 transition-all"
            >
              {t("nav.contactUs")}
            </Link>
          </div>
        </div>

        <div className="relative h-[320px] md:h-[400px] w-full">
          <Image
            src="/images/Engmedicines/EngMedicine.png"
            alt="AzureMed Hub medical inventory"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-10 mt-20">
        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 text-center">{t("about.valuesHeading")}</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((item) => (
            <div key={item.titleKey} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-cyan-500 to-blue-600 text-xl text-white shadow-md">
                {item.icon}
              </span>
              <h3 className="mt-4 font-bold text-zinc-800">{t(item.titleKey)}</h3>
              <p className="mt-2 text-sm text-zinc-600">{t(item.paraKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-10 mt-20">
        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 text-center">{t("about.howToUseHeading")}</h2>
        <p className="mt-3 text-center text-zinc-600 max-w-2xl mx-auto">{t("about.howToUseIntro")}</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOW_TO_STEPS.map((item, index) => (
            <div key={item.titleKey} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white shadow-md">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-xl text-white shadow-md">
                {item.icon}
              </span>
              <h3 className="mt-4 font-bold text-zinc-800">{t(item.titleKey)}</h3>
              <p className="mt-2 text-sm text-zinc-600">{t(item.paraKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
