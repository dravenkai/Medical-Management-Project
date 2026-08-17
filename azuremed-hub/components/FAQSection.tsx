"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

/** Faithful port of Medical_Product/src/components/FAQsection/faq.jsx. */
const FAQS: Array<{ question: TranslationKey; answer: TranslationKey }> = [
  { question: "faq.q1", answer: "faq.a1" },
  { question: "faq.q2", answer: "faq.a2" },
  { question: "faq.q3", answer: "faq.a3" },
  { question: "faq.q4", answer: "faq.a4" },
  { question: "faq.q5", answer: "faq.a5" },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <div id="faq" className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-center gap-8 px-4 py-16 md:px-0 scroll-mt-28">
      <div className="relative max-w-md w-full h-[430px] rounded-xl overflow-hidden hover:scale-[1.03] transition-transform hover:shadow-xl">
        <Image
          src="/images/Engmedicines/FAQsection.jpg"
          alt="Medicine delivery illustration"
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          className="object-cover"
        />
      </div>
      <div>
        <p className="text-indigo-600 text-lg font-medium">{t("faq.badge")}</p>
        <h1 className="text-3xl font-semibold">{t("faq.heading")}</h1>
        <p className="text-sm text-slate-500 mt-2 pb-4">{t("faq.tagline")}</p>

        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              className="border-b border-slate-200 py-4 cursor-pointer"
              key={faq.question}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">{t(faq.question)}</h3>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className={`${isOpen ? "rotate-180" : ""} transition-all duration-500 ease-in-out`}
                >
                  <path
                    d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2"
                    stroke="#1D293D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className={`text-sm text-slate-500 transition-all duration-500 ease-in-out max-w-md overflow-hidden ${
                  isOpen ? "opacity-100 max-h-[300px] translate-y-0 pt-4" : "opacity-0 max-h-0 -translate-y-2"
                }`}
              >
                {t(faq.answer)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
