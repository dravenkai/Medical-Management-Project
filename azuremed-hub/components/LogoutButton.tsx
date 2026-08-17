"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Shared logout control used in every dashboard sidebar and the storefront
 * navbar. Clicking opens a confirm modal; confirming does three things in
 * order:
 *   1. signOut({ redirect: false }) — clears the NextAuth session cookie
 *      server-side (this is the actual auth token; there is no separate
 *      localStorage token in this app to also clear).
 *   2. window.location.replace("/login") — a full navigation (not a Next.js
 *      client-side router push) so the browser reloads from the server
 *      instead of reusing any in-memory app state, and replace() (not
 *      href=) so the now-invalid dashboard page is dropped from history
 *      rather than pushed under a new entry.
 *   3. middleware.ts's Cache-Control: no-store on every dashboard route
 *      means even if the user then presses Back, the browser can't serve a
 *      cached copy from bfcache — it must re-request, and the middleware
 *      redirects them to /login since the session cookie is gone.
 */
export default function LogoutButton({ className = "" }: { className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  async function handleConfirm() {
    setLoading(true);
    await signOut({ redirect: false });
    window.location.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`flex items-center justify-center gap-2 rounded-xl border border-slate-400 px-4 py-2.5 text-base font-semibold text-slate-900 transition-colors shadow-2xl hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${className}`}
      >
        <LogOut size={16} />
        {t("logout.signOut")}
      </button>

      {confirming && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <LogOut size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t("logout.confirmHeading")}</h3>
            <p className="mt-2 text-sm text-slate-500">{t("logout.confirmBody")}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {t("logout.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? t("logout.signingOut") : t("logout.signOut")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
