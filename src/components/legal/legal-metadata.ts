import { asText } from "@prismicio/client";
import type { Metadata } from "next";
import { legalContent, type LegalUid } from "@/content/legal";
import { site } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { alternateLanguages, localePath, localeUrl, openGraphLocales } from "@/i18n/urls";
import { hasPublishedBody } from "./legal-body";
import { fetchLegalPage } from "./legal-document";

/**
 * Where a legal page lives. The slug is the uid, so a document's route follows from its
 * identifier alone and the two cannot drift apart.
 *
 * The French slugs are kept on the English routes (`/en/mentions-legales/`): localizing
 * them needs next-intl's `pathnames` map, which would change how every existing route is
 * declared. Out of scope here, and a stable URL matters more on a legal page than a
 * translated one.
 */
export const legalHref = (uid: LegalUid): string => `/${uid}`;

export async function generateLegalMetadata(locale: Locale, uid: LegalUid): Promise<Metadata> {
  const legalPage = await fetchLegalPage(locale, uid);
  const fallback = legalContent[locale][uid];
  const isPublished = hasPublishedBody(asText(legalPage?.data.body));

  // Either Prismic is authoritative for this page or it is not — the body decides, and
  // the title and description follow it, so a half-filled document cannot pair published
  // copy with a stale summary.
  const title =
    (isPublished && (legalPage?.data.meta_title || legalPage?.data.title)) || fallback.title;
  const description = (isPublished && legalPage?.data.meta_description) || fallback.summary;

  const href = legalHref(uid);

  return {
    title,
    description,
    alternates: {
      canonical: localePath(locale, href),
      languages: alternateLanguages(href),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      url: localeUrl(locale, href),
      title,
      description,
      ...openGraphLocales(locale),
    },
  };
}
