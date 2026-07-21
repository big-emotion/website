import type { Locale } from "./locales";
import { getPathname } from "./navigation";
import { routing } from "./routing";

export const SITE_ORIGIN = "https://big-emotion.com";

// Open Graph wants a full locale tag, not the bare language code we route on.
const OG_LOCALES: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };

/**
 * `getPathname()` does not apply `trailingSlash` (next-intl only normalises when
 * localized `pathnames` are configured), but `next.config.ts` sets it — so every URL we
 * *advertise* is normalised here. Without this, each canonical and hreflang alternate
 * would point at a URL that immediately 308s to its slashed form.
 */
export function localePath(locale: Locale, href: string): string {
  const pathname = getPathname({ locale, href });
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function localeUrl(locale: Locale, href: string): string {
  return new URL(localePath(locale, href), SITE_ORIGIN).toString();
}

/**
 * The `alternates.languages` map for a page, plus `x-default` pointing at French —
 * search engines fall back to it for any language we don't publish.
 */
export function alternateLanguages(href: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, localePath(locale, href)])),
    "x-default": localePath(routing.defaultLocale, href),
  };
}

export function openGraphLocales(locale: Locale) {
  return {
    locale: OG_LOCALES[locale],
    alternateLocale: routing.locales
      .filter((other) => other !== locale)
      .map((other) => OG_LOCALES[other]),
  };
}
