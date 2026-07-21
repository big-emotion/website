"use client";

import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { type Locale, locales } from "@/i18n/locales";
import { usePathname } from "@/i18n/navigation";
import { localePath } from "@/i18n/urls";

// The visible label is the locale code itself, so the only copy involved is the full
// language name announced to screen readers — which lives in `messages/*.json`.
const LANGUAGE_NAME_KEY = {
  fr: "switchToFrench",
  en: "switchToEnglish",
} as const satisfies Record<Locale, string>;

type LocaleSwitcherProps = {
  locale: Locale;
  className?: string;
  /** Lets the mobile drawer close itself when a language is picked. */
  onNavigate?: () => void;
};

/**
 * Language is a URL decision, not a stored preference (DEC-024): each option is a plain
 * deep link to the very page being read, in the other locale — no cookie, no client
 * state, so the choice survives being shared or bookmarked.
 */
export function LocaleSwitcher({ locale, className = "", onNavigate }: LocaleSwitcherProps) {
  const t = useTranslations("header");
  // Locale-free (`/cases`, never `/en/cases`), so it maps one-to-one onto either locale.
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("languageSwitcher")}
      className={`flex items-center ${className}`}
    >
      {locales.map((option) => (
        <NextLink
          key={option}
          // `localePath` rather than the locale-aware `Link`: that one force-prefixes as
          // soon as it is given a `locale` prop, so French would be advertised as
          // `/fr/cases/` and only reach `/cases/` through a redirect. This href is the
          // same canonical path the page publishes as its hreflang alternate.
          href={localePath(option, pathname)}
          hrefLang={option}
          aria-current={option === locale ? "true" : undefined}
          onClick={onNavigate}
          className="font-display inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm uppercase tracking-wide hover:opacity-60 aria-[current=true]:underline aria-[current=true]:underline-offset-4"
        >
          {option.toUpperCase()}
          {/* Keeping the visible "FR" inside the accessible name — instead of replacing
              it with an aria-label — is what satisfies WCAG 2.5.3 for speech input. */}
          <span className="sr-only">{t(LANGUAGE_NAME_KEY[option])}</span>
        </NextLink>
      ))}
    </div>
  );
}
