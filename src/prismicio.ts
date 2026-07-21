import * as prismic from "@prismicio/client";
import type { Locale } from "@/i18n/locales";

/**
 * Prismic client factory. Content is read at build time only — the `/cases`
 * route is force-static — so a missing variable is a build-time failure rather
 * than a runtime one, and there is no fallback to `site.ts`: a deploy that
 * silently served stale copy because a token expired would be worse than a
 * deploy that refuses to build.
 *
 * Publishing therefore requires a rebuild + deploy. See the "Prismic" section
 * of AGENTS.md.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `${name} is not set. Prismic content is fetched at build time, so the build ` +
        `cannot continue without it. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

// The return type is inferred on purpose: `prismicio-types.d.ts` augments prismic's
// `CreateClient` interface so the client is typed against AllDocumentTypes. Annotating
// it as `prismic.Client` here would erase that back to a generic document.
export function createClient(config: prismic.ClientConfig = {}) {
  return prismic.createClient(requireEnv("PRISMIC_REPOSITORY_NAME"), {
    accessToken: requireEnv("PRISMIC_ACCESS_TOKEN"),
    ...config,
  });
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

export function prismicLocale(locale: Locale): string {
  return PRISMIC_LOCALES[locale];
}
