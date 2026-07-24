import * as prismic from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";
import { LEGAL_UIDS, type LegalUid } from "@/content/legal";
import type { Locale } from "@/i18n/locales";
import { localePath } from "@/i18n/urls";

/**
 * Prismic client factory.
 *
 * Content is pre-rendered at build time and refreshed **on demand**: every query is
 * cached under `PRISMIC_CACHE_TAG`, and the publish webhook (`/api/revalidate`) drops
 * that tag so the next request regenerates the page. Publishing therefore no longer
 * needs a rebuild or a deploy (SWBE-80 / DEC-021, superseding the build-time-only
 * contract of SWBE-24).
 *
 * There is still no fallback to `site.ts` when a variable is missing: a deploy that
 * silently served stale copy because a token expired would be worse than one that
 * refuses to build.
 */

/**
 * One tag for all Prismic content, dropped wholesale on any publish.
 *
 * Per-document tags would be finer, but a tag has to be attached when the request is
 * issued — before the response reveals which documents came back. Resolving that needs
 * Next's Cache Components (`cacheTag`), which this app does not enable. Revalidating
 * every Prismic-backed page on any publish is a superset of the affected pages: a few
 * extra regenerations, never a stale one.
 */
export const PRISMIC_CACHE_TAG = "prismic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `${name} is not set. Prismic content is pre-rendered at build time, so the build ` +
        `cannot continue without it. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

/** The repository the toolbar registers against — see `<PrismicPreview>` in the layout. */
export function prismicRepositoryName(): string {
  return requireEnv("PRISMIC_REPOSITORY_NAME");
}

// The return type is inferred on purpose: `prismicio-types.d.ts` augments prismic's
// `CreateClient` interface so the client is typed against AllDocumentTypes. Annotating
// it as `prismic.Client` here would erase that back to a generic document.
export function createClient(config: prismic.ClientConfig = {}) {
  const client = prismic.createClient(requireEnv("PRISMIC_REPOSITORY_NAME"), {
    accessToken: requireEnv("PRISMIC_ACCESS_TOKEN"),
    fetchOptions: { cache: "force-cache", next: { tags: [PRISMIC_CACHE_TAG] } },
    ...config,
  });

  // Follows the preview ref when an editor has a preview session open. Outside one it
  // is inert — `getPreviewRef` bails before touching cookies when draft mode is off, so
  // ordinary requests keep serving the cached, published content. Preview responses do
  // not poison that cache either: the ref travels in the query string, so a previewed
  // query is a different cache key from the published one.
  enableAutoPreviews({ client });

  return client;
}

/**
 * Route locale → Prismic locale. The two vocabularies differ (Prismic locales are
 * region-qualified) and the API rejects an unknown `lang` outright, so the mapping
 * is spelled out rather than derived from the segment.
 */
const PRISMIC_LOCALES: Record<Locale, string> = {
  fr: "fr-fr",
  en: "en-us",
};

const ROUTE_LOCALES: Record<string, Locale> = Object.fromEntries(
  Object.entries(PRISMIC_LOCALES).map(([locale, lang]) => [lang, locale as Locale]),
);

export function prismicLocale(locale: Locale): string {
  return PRISMIC_LOCALES[locale];
}

export function routeLocale(lang: string): Locale | undefined {
  return ROUTE_LOCALES[lang];
}

/**
 * Where a document lives on this site. Used to send an editor from the Prismic toolbar
 * to the page they are previewing.
 *
 * Returns `null` for anything it cannot place — an unknown type, an unknown locale, a
 * document with no uid — which makes `redirectToPreviewURL` fall back to its default
 * URL rather than inventing a path that 404s.
 */
export const linkResolver: prismic.LinkResolverFunction = (document) => {
  const locale = routeLocale(document.lang);
  if (!locale) return null;

  if (document.type === "case_study" && document.uid) {
    return localePath(locale, `/cases/${document.uid}`);
  }

  if (document.type === "page" && document.uid === "home") {
    return localePath(locale, "/");
  }

  if (document.type === "article" && document.uid) {
    return localePath(locale, `/blog/${document.uid}`);
  }

  // Legal routes are named after their uid. Checked against the known list rather than
  // trusting the uid, so a stray document cannot claim a top-level path that 404s.
  if (document.type === "legal_page" && isLegalUid(document.uid)) {
    return localePath(locale, `/${document.uid}`);
  }

  return null;
};

function isLegalUid(uid: string | null | undefined): uid is LegalUid {
  return LEGAL_UIDS.includes(uid as LegalUid);
}
