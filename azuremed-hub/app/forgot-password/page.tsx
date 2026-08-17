"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { XIcon, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError("");

    if (!email.trim()) {
      setFieldError(t("forgotPassword.emailRequired"));
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError(t("forgotPassword.emailInvalid"));
      return;
    }

    setLoading(true);
    const result = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).then((r) => r.json());
    setLoading(false);
    // dev_reset_url only ever comes back in local dev with no SMTP
    // configured (see the route) — shows the link on-screen instead of
    // needing to dig through server console output while testing.
    setDevResetUrl(result?.dev_reset_url ?? null);
    // Always show the same confirmation, whether or not the email exists —
    // matches the API's response, which never reveals account existence.
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => router.push("/login")}
          aria-label={t("forgotPassword.closeReturnLogin")}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-100 hover:text-slate-800"
        >
          <XIcon size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <Image src="/images/logo.png" alt="AzureMed Hub logo" width={44} height={44} className="h-11 w-11 rounded-2xl object-contain bg-slate-100 p-1.5" />
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-xl font-black tracking-tight text-indigo-400 italic">AzureMed</span>
            <span className="text-xl font-black tracking-tight text-blue-600 italic">HUB</span>
          </div>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Mail size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">{t("forgotPassword.checkEmail")}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {(() => {
                const [before, after] = t("forgotPassword.emailSentInfo").split("{email}");
                return (
                  <>
                    {before}
                    <span className="font-semibold text-slate-700">{email}</span>
                    {after}
                  </>
                );
              })()}
            </p>

            {devResetUrl && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                  {t("forgotPassword.devModeNoSmtp")}
                </p>
                <p className="mt-1 text-xs text-amber-700">{t("forgotPassword.devModeInfo")}</p>
                <a
                  href={devResetUrl}
                  className="mt-2 block truncate text-xs font-bold text-blue-600 underline hover:text-blue-700"
                >
                  {devResetUrl}
                </a>
              </div>
            )}

            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-slate-800">{t("forgotPassword.heading")}</h2>
            <p className="mt-2 text-sm text-slate-500">{t("forgotPassword.subheading")}</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("forgotPassword.emailLabel")}</label>
                <input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError("");
                  }}
                  className={`mt-1 w-full rounded-xl border bg-slate-50 p-3.5 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                    fieldError ? "border-red-400 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                  }`}
                />
                {fieldError && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold tracking-[0.15em] text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
              </button>

              <Link href="/login" className="block text-center text-xs font-bold text-slate-400 hover:text-slate-600">
                &larr; {t("forgotPassword.backToLogin")}
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
