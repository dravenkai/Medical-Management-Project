"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const LOW_STOCK_THRESHOLD = 20;

type ConfidenceStatus = "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "NO_MATCH";

export interface MedicineDetail {
  id: string | null;
  name: string;
  expireDate: string | null;
  stock: { quantity: number; unit: string };
  about: string | null;
  howToUse: string | null;
  matched: boolean;
  category: string | null;
  imageUrl: string | null;
  priceKs: number | null;
}

export interface DetectionResult {
  detection: { predictedClass: string | null; confidence: number; status: ConfidenceStatus };
  medicineDetail: MedicineDetail | null;
  topMatches: Array<{ label: string; confidence: number }>;
}

const STATUS_STYLES: Record<ConfidenceStatus, string> = {
  HIGH_CONFIDENCE: "bg-emerald-100 text-emerald-700",
  MEDIUM_CONFIDENCE: "bg-amber-100 text-amber-700",
  LOW_CONFIDENCE: "bg-orange-100 text-orange-700",
  NO_MATCH: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL_KEYS: Record<ConfidenceStatus, TranslationKey> = {
  HIGH_CONFIDENCE: "detect.highConfidence",
  MEDIUM_CONFIDENCE: "detect.mediumConfidence",
  LOW_CONFIDENCE: "detect.lowConfidence",
  NO_MATCH: "detect.noMatch",
};

export default function MedicineDetectionCard({
  result,
  onAddToCart,
}: {
  result: DetectionResult;
  onAddToCart?: () => void;
}) {
  const { detection, medicineDetail, topMatches } = result;
  const accuracyPct = Math.round(detection.confidence * 100);
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
        {medicineDetail?.matched && (
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
            {medicineDetail.imageUrl ? (
              <Image src={medicineDetail.imageUrl} alt={medicineDetail.name} fill sizes="64px" className="object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">{t("detect.noPhoto")}</div>
            )}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="break-words text-lg font-bold text-slate-800 dark:text-slate-100">
              {medicineDetail?.name ?? detection.predictedClass ?? t("detect.noPrediction")}
            </p>
            {medicineDetail?.expireDate && (
              <p className="mt-0.5 text-xs text-slate-500">{t("detect.expires")} {medicineDetail.expireDate}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[detection.status]}`}>
            {t(STATUS_LABEL_KEYS[detection.status])} · {accuracyPct}%
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Only a High Confidence (>=92%) catalog match gets shown as a real
            result — anything else (low confidence, or recognized but not in
            the catalog) is a single, plain error rather than two different
            softened messages. */}
        {!medicineDetail?.matched && (
          <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {medicineDetail
              ? t("detect.recognizedNotInCatalog").replace("{name}", medicineDetail.name)
              : t("detect.couldNotDetect")}
          </p>
        )}

        {medicineDetail?.matched && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">{t("detect.stock")}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  medicineDetail.stock.quantity < LOW_STOCK_THRESHOLD
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {medicineDetail.stock.quantity} {medicineDetail.stock.unit}
                {medicineDetail.stock.quantity < LOW_STOCK_THRESHOLD ? ` · ${t("detect.lowStock")}` : ""}
              </span>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{t("detect.about")}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {medicineDetail.about ?? t("detect.noDescription")}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">{t("detect.howToUse")}</p>
              <p className="mt-1 text-sm text-blue-800">
                {medicineDetail.howToUse ?? t("detect.noUsageInstructions")}
              </p>
            </div>

            {onAddToCart && (
              <button
                type="button"
                onClick={onAddToCart}
                disabled={medicineDetail.stock.quantity <= 0}
                className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("product.addToCart")}
              </button>
            )}
          </>
        )}

        {topMatches.length > 0 && (
          <details className="rounded-xl border border-slate-100 dark:border-slate-800">
            <summary className="cursor-pointer px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("detect.otherMatches")}
            </summary>
            <ul className="space-y-1 px-4 pb-3">
              {topMatches.map((match) => (
                <li key={match.label} className="flex justify-between text-xs text-slate-500">
                  <span>{match.label}</span>
                  <span>{Math.round(match.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
