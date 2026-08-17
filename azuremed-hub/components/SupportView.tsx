"use client";

import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";
import SupportQueryForm from "@/components/SupportQueryForm";

interface Query {
  id: number;
  subject: string;
  message: string;
  status: string;
  staff_response: string | null;
  responded_at: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  answered: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const STATUS_KEYS: Record<string, TranslationKey> = {
  open: "support.statusOpen",
  answered: "support.statusAnswered",
  closed: "support.statusClosed",
};

/**
 * app/(storefront)/support/page.tsx is a Server Component (auth check + DB
 * query) so it can't call the client-only useLanguage() hook — this takes
 * the already-fetched queries and does all the rendering/translation.
 */
export default function SupportView({ queries }: { queries: Query[] }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <h1 className="text-3xl font-bold text-slate-800">{t("support.heading")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("support.subheading")}</p>

      <div className="mt-8">
        <SupportQueryForm />
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{t("support.yourMessages")}</h2>
        {queries.length === 0 && (
          <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            {t("support.noMessagesYet")}
          </p>
        )}
        {queries.map((query) => (
          <div key={query.id} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-800">{query.subject}</p>
                <p className="mt-1 text-sm text-slate-600">{query.message}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-3 py-1 text-[10px] font-black uppercase ${STATUS_BADGE[query.status] ?? STATUS_BADGE.open}`}>
                {t(STATUS_KEYS[query.status] ?? "support.statusOpen")}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400">{new Date(query.created_at).toLocaleString()}</p>

            {query.staff_response && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-blue-500">{t("support.response")}</p>
                <p className="mt-1 text-sm text-blue-900">{query.staff_response}</p>
                {query.responded_at && (
                  <p className="mt-2 text-xs text-blue-400">{new Date(query.responded_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
