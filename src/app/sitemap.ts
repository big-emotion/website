import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { alternateLanguages, localeUrl, SITE_ORIGIN } from "@/i18n/urls";

// Evaluated once at build and frozen into the standalone output — no revalidate, no
// dynamic params. It sits outside `[locale]` because it is a route handler, not a
// page: it enumerates the locales itself rather than being rendered per locale.
export const dynamic = "force-static";

// The one-pager plus the four section routes (SWBE-21), each in both locales. Every
// entry advertises its counterpart through `alternates.languages`, so a crawler that
// finds the French page also learns the English one exists.
const ROUTES = ["/", "/approach", "/cases", "/culture", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: localeUrl(locale, route),
      lastModified,
      changeFrequency: "monthly" as const,
      // The home page is the entry point; the section routes sit one level below it.
      priority: route === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(alternateLanguages(route)).map(([key, path]) => [
            key,
            new URL(path, SITE_ORIGIN).toString(),
          ]),
        ),
      },
    })),
  );
}
