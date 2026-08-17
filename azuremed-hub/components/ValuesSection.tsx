"use client";

import Image from "next/image";
import { FaStethoscope, FaFlask, FaShieldVirus, FaCheckDouble } from "react-icons/fa6";
import Heading from "@/components/Heading";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

// Same content as about.value* on the About page (kept as one source of
// translated copy rather than duplicating fresh strings here).
const VALUES: Array<{ id: number; titleKey: TranslationKey; paraKey: TranslationKey; icon: React.ReactNode }> = [
  { id: 1, titleKey: "about.valueQualityTitle", paraKey: "about.valueQualityPara", icon: <FaCheckDouble /> },
  { id: 2, titleKey: "about.valueSupportTitle", paraKey: "about.valueSupportPara", icon: <FaStethoscope /> },
  { id: 3, titleKey: "about.valueSafetyTitle", paraKey: "about.valueSafetyPara", icon: <FaShieldVirus /> },
  { id: 4, titleKey: "about.valueHerbalTitle", paraKey: "about.valueHerbalPara", icon: <FaFlask /> },
];

export default function ValuesSection() {
  const { t } = useLanguage();
  const leftValues = VALUES.slice(0, 2);
  const rightValues = VALUES.slice(2);

  return (
    <section className="bg-white">
      <div className="max-w-[1400px] mx-auto px-10 py-16">
        <Heading highlight={t("values.highlight")} heading={t("values.heading")} />

        <div className="flex md:flex-row flex-col gap-16 md:gap-10 mt-16 items-center">
          <div className="md:w-1/3 flex flex-col gap-24">
            {leftValues.map((item) => (
              <div key={item.id} className="flex md:flex-row-reverse items-center gap-7">
                <span className="flex justify-center items-center text-3xl text-white bg-gradient-to-b from-cyan-500 to-blue-600 w-16 h-16 rounded-full shadow-lg shrink-0">
                  {item.icon}
                </span>
                <div className="md:text-right">
                  <h3 className="text-zinc-800 text-2xl font-bold">{t(item.titleKey)}</h3>
                  <p className="text-zinc-600 mt-2 text-sm md:text-base">{t(item.paraKey)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="md:w-1/3 flex justify-center">
            <div className="relative h-[350px] w-full max-h-[450px]">
              <Image
                src="/images/Engmedicines/EngMedicine.png"
                alt="Medical Inventory"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="md:w-1/3 flex flex-col gap-24">
            {rightValues.map((item) => (
              <div key={item.id} className="flex items-center gap-7">
                <span className="flex justify-center items-center text-3xl text-white bg-gradient-to-b from-cyan-500 to-blue-600 w-16 h-16 rounded-full shadow-lg shrink-0">
                  {item.icon}
                </span>
                <div>
                  <h3 className="text-zinc-800 text-2xl font-bold">{t(item.titleKey)}</h3>
                  <p className="text-zinc-600 mt-2 text-sm md:text-base">{t(item.paraKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
