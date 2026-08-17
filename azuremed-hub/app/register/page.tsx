"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";
import { FaFacebook, FaGoogle, FaTelegram, FaViber } from "react-icons/fa6";
import { validatePasswordStrength, PASSWORD_RULES_TEXT } from "@/lib/passwordRules";
import { useLanguage } from "@/components/LanguageContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  firstName?: string;
  email?: string;
  password?: string;
}

/**
 * Faithful port of Medical_Product/src/components/LogIn/SignUp.jsx. Changed:
 * react-router -> next/link + useRouter; raw fetch to the old PHP
 * /api/auth/register + localStorage token -> our real /api/auth/register
 * (always creates role='user') followed by a real NextAuth sign-in.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const nextFieldErrors: FieldErrors = {};
    if (!firstName.trim()) {
      nextFieldErrors.firstName = t("register.firstNameRequired");
    }
    if (!email.trim()) {
      nextFieldErrors.email = t("login.emailRequired");
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextFieldErrors.email = t("login.emailInvalid");
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      nextFieldErrors.password = passwordError;
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setLoading(true);
    const recaptchaToken = await getRecaptchaToken("register");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password, recaptchaToken }),
    }).then((r) => r.json());

    if (!response.success) {
      setLoading(false);
      setError(response.message ?? t("register.registrationFailed"));
      return;
    }

    const loginRecaptchaToken = await getRecaptchaToken("login");
    await signIn("credentials", { email, password, recaptchaToken: loginRecaptchaToken, redirect: false });
    setLoading(false);
    setShowSuccessDialog(true);
  }

  if (showSuccessDialog) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
          <h3 className="text-2xl font-extrabold text-slate-800">{t("register.signUpSuccess")}</h3>
          <p className="mt-3 text-sm text-slate-600">{t("register.accountCreated")}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-700"
          >
            {t("cart.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative flex min-h-[600px] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label={t("auth.closeReturnHome")}
          className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md ring-1 ring-slate-100 transition-all hover:bg-slate-100 hover:text-slate-800"
        >
          <XIcon size={20} />
        </button>

        {/* LEFT: SIGNUP FORM */}
        <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <Image src="/images/logo.png" alt="AzureMed Hub logo" width={48} height={48} className="h-12 w-12 rounded-2xl object-contain bg-slate-100 p-1.5" />
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-2xl font-black tracking-tight text-indigo-400 italic">AzureMed</span>
                  <span className="text-2xl font-black tracking-tight text-blue-600 italic">HUB</span>
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t("register.createProfile")}</h2>
              <p className="mt-2 text-sm text-slate-500">{t("register.subtitle")}</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("register.firstName")}</label>
                  <input
                    type="text"
                    placeholder={t("register.firstNamePlaceholder")}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                    }}
                    className={`mt-1 w-full rounded-xl border bg-slate-50 p-3 text-sm outline-none transition-all focus:ring-2 ${
                      fieldErrors.firstName ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:ring-blue-500"
                    }`}
                  />
                  {fieldErrors.firstName && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.firstName}</p>}
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("register.lastName")}</label>
                  <input
                    type="text"
                    placeholder={t("register.lastNamePlaceholder")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("register.registeredEmail")}</label>
                <input
                  type="email"
                  placeholder={t("register.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`mt-1 w-full rounded-xl border bg-slate-50 p-3 text-sm outline-none transition-all focus:ring-2 ${
                    fieldErrors.email ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
                {fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
              </div>

              <div className="relative">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("auth.passwordLabel")}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  minLength={8}
                  className={`mt-1 w-full rounded-xl border bg-slate-50 p-3 text-sm outline-none transition-all focus:ring-2 ${
                    fieldErrors.password ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-11 text-slate-400 hover:text-blue-600">
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
                {fieldErrors.password ? (
                  <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.password}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">{PASSWORD_RULES_TEXT}</p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("register.registering") : t("register.registerAccount")}
              </button>
            </form>

            <div className="mt-10 text-center">
              <span className="bg-white px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t("register.verifiedHealthIdentity")}</span>
              <div className="mt-6 flex justify-center gap-5">
                <SocialIcon icon={<FaGoogle />} color="hover:text-red-500" />
                <SocialIcon icon={<FaFacebook />} color="hover:text-blue-600" />
                <SocialIcon icon={<FaTelegram />} color="hover:text-sky-500" />
                <SocialIcon icon={<FaViber />} color="hover:text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: BRANDING OVERLAY */}
        <div
          className="relative hidden w-1/2 flex-col justify-between bg-indigo-600 p-12 text-white lg:flex"
          style={{
            clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 0% 50%)",
            backgroundImage: "linear-gradient(rgba(163, 184, 253, 0.8), rgba(69, 110, 245, 0.8)), url(/images/Engmedicines/Hero.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            <Image src="/images/logo.png" alt="AzureMed Hub logo" width={48} height={48} className="h-12 w-12 rounded-2xl object-contain bg-white/10 p-1.5" />
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-2xl font-black tracking-tight italic">AzureMed</span>
              <span className="text-2xl font-black tracking-tight italic text-blue-200">HUB</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold uppercase">{t("auth.welcomeBack")}</h1>
            <p className="mb-8 max-w-sm text-blue-100/90 leading-relaxed">{t("register.alreadyHaveAccount")}</p>
            <Link href="/login">
              <button className="group flex items-center gap-2 rounded-full border-2 border-white/50 px-10 py-3 font-bold transition-all hover:bg-white hover:text-blue-600 hover:border-white uppercase tracking-widest">
                {t("register.authorizeLogIn")}
              </button>
            </Link>
          </div>

          <div className="relative z-10 text-[10px] text-blue-200/50 text-center uppercase tracking-[0.2em]">
            {t("register.aesEncryption")}
          </div>
        </div>
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
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 opacity-60 ${color}`}
    >
      <span className="relative z-10 text-xl">{icon}</span>
    </button>
  );
}