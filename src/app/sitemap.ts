import type { MetadataRoute } from "next";
import { playgroundEffects } from "@/components/playground/effects";
import { LEGAL_UIDS } from "@/content/legal";
import { locales } from "@/i18n/locales";
import { alternateLanguages, alternateLanguagesAmong, localeUrl, SITE_ORIGIN } from "@/i18n/urls";
import { createClient, prismicLocale } from "@/prismicio";

// The one-pager, the four section routes (SWBE-21), the blog listing (SWBE-82) and
// the playground gallery (SWBE-211), each in both locales. Every entry advertises its
// counterpart through `alternates.languages`, so a crawler that finds the French page
// also learns the English one exists.
const ROUTES = [
  "/",
  "/approach",
  "/cases",
  "/culture",
  "/blog",
  "/playground",
  "/contact",
] as const;

// Deliberately unpinned — no `dynamic`/`force-static`. Blog articles are Prismic
// content (DEC-021/SWBE-80): a `force-static` sitemap would freeze their URLs until
// the next deploy, defeating the deploy-free publishing this app is built around.
// The Prismic client still caches under the shared tag, so the publish webhook
// regenerates this route along with every other Prismic-backed page.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routeEntries = ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: localeUrl(locale, route),
      lastModified,
      changeFrequency: "monthly" as const,
      // The home page is the entry point; every other route sits one level below it.
      priority: route === "/" ? 1 : 0.8,
      alternates: { languages: absoluteAlternates(alternateLanguages(route)) },
    })),
  );

  const articleEntries = await articleSitemapEntries(lastModified);
  const effectEntries = playgroundEffectSitemapEntries(lastModified);
  const legalEntries = legalSitemapEntries(lastModified);

  return [...routeEntries, ...articleEntries, ...effectEntries, ...legalEntries];
}

// The legal routes (SWBE-34), at the lowest priority and the slowest change frequency on
// the site: they must be discoverable, but they are not what anyone should land on from a
// search. No availability probe, unlike the articles: an empty Prismic document still
// renders the mandatory copy, so both locales always exist.
function legalSitemapEntries(lastModified: Date): MetadataRoute.Sitemap {
  return LEGAL_UIDS.flatMap((uid) => {
    const href = `/${uid}`;

    return locales.map((locale) => ({
      url: localeUrl(locale, href),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
      alternates: { languages: absoluteAlternates(alternateLanguages(href)) },
    }));
  });
}

// Registry-driven, unlike the articles above: the registry is a build-time module
// (REQ-038's "registry-driven growth"), not Prismic content, so there is nothing here
// that needs the publish-webhook re-render contract either.
function playgroundEffectSitemapEntries(lastModified: Date): MetadataRoute.Sitemap {
  return playgroundEffects.flatMap((effect) => {
    const href = `/playground/${effect.slug}`;

    return locales.map((locale) => ({
      url: localeUrl(locale, href),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: absoluteAlternates(alternateLanguages(href)) },
    }));
  });
}

async function articleSitemapEntries(lastModified: Date): Promise<MetadataRoute.Sitemap> {
  const client = createClient();

  const articlesByLocale = new Map(
    await Promise.all(
      locales.map(
        async (locale) =>
          [locale, await client.getAllByType("article", { lang: prismicLocale(locale) })] as const,
      ),
    ),
  );

  const uids = new Set(
    locales.flatMap((locale) =>
      (articlesByLocale.get(locale) ?? []).map((article) => article.uid!),
    ),
  );

  return [...uids].flatMap((uid) => {
    const availableLocales = locales.filter((locale) =>
      articlesByLocale.get(locale)?.some((article) => article.uid === uid),
    );
    const href = `/blog/${uid}`;

    return availableLocales.map((locale) => ({
      url: localeUrl(locale, href),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: absoluteAlternates(alternateLanguagesAmong(href, availableLocales)),
      },
    }));
  });
}

function absoluteAlternates(languages: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(languages).map(([key, path]) => [key, new URL(path, SITE_ORIGIN).toString()]),
  );
}
