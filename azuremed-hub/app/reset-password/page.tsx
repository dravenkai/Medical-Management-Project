"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { XIcon, CheckCircle, EyeIcon, EyeOffIcon } from "lucide-react";
import { validatePasswordStrength, PASSWORD_RULES_TEXT } from "@/lib/passwordRules";
import { useLanguage } from "@/components/LanguageContext";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError("");

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setFieldError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setFieldError(t("resetPassword.passwordsDontMatch"));
      return;
    }

    setLoading(true);
    const result = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).then((r) => r.json());
    setLoading(false);

    if (!result.success) {
      setFieldError(result.message ?? t("resetPassword.couldNotReset"));
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-slate-800">{t("resetPassword.invalidLink")}</h2>
        <p className="mt-2 text-sm text-slate-500">{t("resetPassword.missingToken")}</p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          {t("resetPassword.requestNewLink")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle size={24} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">{t("resetPassword.passwordReset")}</h2>
        <p className="mt-2 text-sm text-slate-500">{t("resetPassword.updatedCanLogin")}</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          {t("resetPassword.goToLogin")}
        </button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-extrabold text-slate-800">{t("resetPassword.setNewPassword")}</h2>
      <p className="mt-2 text-sm text-slate-500">{t("resetPassword.chooseStrongPassword")}</p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("resetPassword.newPassword")}</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldError("");
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 pr-11 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-blue-600 transition-colors"
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
          <p className="mt-1.5 text-xs text-slate-400">{PASSWORD_RULES_TEXT}</p>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("resetPassword.confirmPassword")}</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldError("");
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>

        {fieldError && <p className="text-xs font-semibold text-red-600">{fieldError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold tracking-[0.15em] text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t("resetPassword.resetting") : t("resetPassword.resetPasswordBtn")}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();

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

        <Suspense fallback={<p className="text-sm text-slate-400">{t("resetPassword.loading")}</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
