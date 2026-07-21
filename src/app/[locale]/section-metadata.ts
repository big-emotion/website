import type { Metadata } from "next";
import { content, site } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { alternateLanguages, localePath, localeUrl, openGraphLocales } from "@/i18n/urls";

/**
 * Metadata for one of the four section routes (SWBE-21). The title is read back from the
 * nav entry pointing at the route, so a page can never be indexed under a name different
 * from the one it is navigated by — and a route that no nav entry reaches fails the build
 * rather than shipping an empty <title>.
 */
export function sectionMetadata(locale: Locale, href: string, description: string): Metadata {
  const navEntry = content[locale].nav.find((item) => item.href === href);
  if (!navEntry) {
    throw new Error(`No ${locale} nav entry points at ${href}.`);
  }

  return {
    title: navEntry.label,
    description,
    alternates: {
      canonical: localePath(locale, href),
      languages: alternateLanguages(href),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      url: localeUrl(locale, href),
      title: navEntry.label,
      description,
      ...openGraphLocales(locale),
    },
  };
}
