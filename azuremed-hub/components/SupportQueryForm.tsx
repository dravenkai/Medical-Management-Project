"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

export default function SupportQueryForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError(t("supportForm.fillBothFields"));
      return;
    }

    setSubmitting(true);
    const result = await fetch("/api/support/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    }).then((r) => r.json());
    setSubmitting(false);

    if (!result.success) {
      setError(result.message ?? t("supportForm.couldNotSend"));
      return;
    }

    setSubject("");
    setMessage("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-900">{t("supportForm.heading")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("supportForm.subheading")}</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("supportForm.subject")}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("supportForm.subjectPlaceholder")}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("supportForm.message")}</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("supportForm.messagePlaceholder")}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t("supportForm.sending") : t("supportForm.sendMessage")}
        </button>
      </div>
    </form>
  );
}
