"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Floating "Need Help?" button, bottom-right on every storefront page except
 * /checkout (see the comment there — a third-party Elfsight embed used to
 * sit here and blocked the "Confirm Payment" button; this custom version
 * avoids that same risk since we control its z-index and positioning
 * directly). Deep-links to the Telegram medicine-info bot.
 *
 * Icon-only by default; the "Need Help?" label is collapsed to zero width
 * and reveals on hover/focus via a max-width + opacity transition, rather
 * than being unmounted — animating display:none isn't possible, and
 * width:auto isn't animatable, so the label needs a real (generous) max-width
 * target to transition to.
 */
export default function NeedHelpButton() {
  const pathname = usePathname();
  const { t } = useLanguage();
  if (pathname?.startsWith("/checkout")) return null;

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const href = botUsername ? `https://t.me/${botUsername}` : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!href}
      onClick={(e) => {
        if (!href) e.preventDefault();
      }}
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-0 rounded-full bg-black p-3 text-white shadow-lg transition-all hover:gap-2 hover:pr-5 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:gap-2 focus-visible:pr-5"
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100 group-focus-visible:max-w-xs group-focus-visible:opacity-100">
        {t("needHelp.label")}
      </span>
    </a>
  );
}
