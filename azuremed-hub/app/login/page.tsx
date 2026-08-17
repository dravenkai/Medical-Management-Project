"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaGoogle, FaTelegram, FaViber } from "react-icons/fa6";
import { XIcon } from "lucide-react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";
import { useLanguage } from "@/components/LanguageContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Faithful port of Medical_Product/src/components/LogIn/SignIn.jsx. Changed:
 * react-router Link/useNavigate -> next/link + useRouter; the raw
 * fetch(`${API_BASE_URL}/api/auth/login`) + localStorage token -> real
 * NextAuth signIn(), which sets an httpOnly session cookie instead.
 */
export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function finishLogin() {
    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;
    router.push(role === "admin" ? "/admin" : role === "staff" ? "/staff" : role === "agent" ? "/portal" : "/");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextFieldErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      nextFieldErrors.email = t("login.emailRequired");
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextFieldErrors.email = t("login.emailInvalid");
    }
    if (!password) {
      nextFieldErrors.password = t("login.passwordRequired");
    }
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.email || nextFieldErrors.password) {
      return;
    }

    setLoading(true);
    const recaptchaToken = await getRecaptchaToken("login");
    const result = await signIn("credentials", { email, password, recaptchaToken, redirect: false });
    setLoading(false);

    if (result?.error) {
      setFieldErrors({ password: t("login.incorrectCredentials") });
      return;
    }

    await finishLogin();
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="relative flex min-h-[600px] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label={t("auth.closeReturnHome")}
          className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md ring-1 ring-slate-100 transition-all hover:bg-slate-100 hover:text-slate-800"
        >
          <XIcon size={20} />
        </button>

        {/* LEFT: BRANDING */}
        <section
          className="relative hidden w-1/2 flex-col justify-between p-12 text-white lg:flex"
          style={{
            clipPath: "polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)",
            backgroundImage: "url(/images/Engmedicines/FAQsection.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-blue-900/70 z-0" />

          <div className="relative z-10 flex items-center gap-3">
            <Image src="/images/logo.png" alt="AzureMed Hub logo" width={48} height={48} className="h-12 w-12 rounded-2xl object-contain bg-white/10 p-1.5" />
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-2xl font-black tracking-tight italic">AzureMed</span>
              <span className="text-2xl font-black tracking-tight italic text-blue-300">HUB</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold uppercase tracking-tight">{t("auth.needAccount")}</h1>
            <p className="mb-10 max-w-xs text-lg text-blue-50/90 leading-relaxed">{t("auth.joinCommunity")}</p>
            <Link href="/register">
              <button type="button" className="group flex items-center gap-2 rounded-full border-2 border-white px-10 py-3 font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-blue-700">
                {t("auth.createHealthProfile")}
              </button>
            </Link>
          </div>

          <div className="relative z-10 text-[10px] text-blue-200/50 uppercase tracking-[0.3em] font-bold">
            {t("auth.hipaaCompliant")}
          </div>
        </section>

        {/* RIGHT: LOGIN FORM */}
        <section className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            <header className="mb-10 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <Image src="/images/logo.png" alt="AzureMed Hub logo" width={48} height={48} className="h-12 w-12 rounded-2xl object-contain bg-slate-100 p-1.5" />
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-2xl font-black tracking-tight text-indigo-400 italic">AzureMed</span>
                  <span className="text-2xl font-black tracking-tight text-blue-600 italic">HUB</span>
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t("auth.welcomeBack")}</h2>
              <p className="mt-3 text-slate-500 text-sm">{t("auth.loginSubtitle")}</p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("auth.emailLabel")}</label>
                <input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`mt-1 w-full rounded-xl border bg-slate-50 p-3.5 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                    fieldErrors.email ? "border-red-400 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                  }`}
                />
                {fieldErrors.email && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
              </div>

              <div className="relative">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("auth.passwordLabel")}</label>
                  <Link href="/forgot-password" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`mt-1 w-full rounded-xl border bg-slate-50 p-3.5 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                    fieldErrors.password ? "border-red-400 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                  }`}
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-[38px] text-slate-400 hover:text-blue-600 transition-colors">
                  {showPassword ? (
                    <span className="text-[10px] font-bold">{t("auth.hide")}</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {fieldErrors.password && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="remember" className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-500 cursor-pointer">{t("auth.keepLoggedIn")}</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold tracking-[0.15em] text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("auth.loggingIn") : t("auth.secureLogin")}
              </button>
            </form>

            <footer className="mt-12 text-center">
              <div className="relative mb-6 flex items-center justify-center">
                <div className="absolute w-full border-t border-slate-100" />
                <span className="relative bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("auth.verifiedHealthLogin")}</span>
              </div>
              <div className="flex justify-center gap-4">
                <SocialIcon icon={<FaGoogle />} color="text-red-500 hover:bg-red-50" />
                <SocialIcon icon={<FaFacebook />} color="text-blue-800 hover:bg-blue-50" />
                <SocialIcon icon={<FaTelegram />} color="text-sky-500 hover:bg-sky-50" />
                <SocialIcon icon={<FaViber />} color="text-purple-600 hover:bg-purple-50" />
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}

function SocialIcon({ icon, color }: { icon: React.ReactNode; color: string }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      title={t("auth.comingSoon")}
      disabled
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-xl shadow-sm transition-all duration-300 opacity-60 ${color}`}
    >
      {icon}
    </button>
  );
}
