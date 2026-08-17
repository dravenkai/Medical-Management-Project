"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "azuremed:lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Read the saved preference after mount (not during SSR) so the server-
  // rendered HTML and first client render match — avoids a hydration
  // mismatch flash between the default "en" and a saved "my" preference.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "my") setLangState(saved);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: TranslationKey): string {
    return translations[key]?.[lang] ?? translations[key]?.en ?? key;
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

// Some components (LogoutButton, etc.) are shared between the storefront
// (wrapped in LanguageProvider) and the admin/staff/portal dashboards
// (deliberately not — see translations.ts's own scope note: this dictionary
// only covers storefront chrome). Throwing here would crash logout on every
// dashboard the moment such a shared component called t(); falling back to
// English-only instead means those surfaces keep working exactly as before,
// while the storefront still gets full translation.
function englishOnlyFallback(): LanguageContextValue {
  return {
    lang: "en",
    setLang: () => {},
    t: (key) => translations[key]?.en ?? key,
  };
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? englishOnlyFallback();
}
