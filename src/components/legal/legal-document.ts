import type { Content } from "@prismicio/client";
import type { LegalUid } from "@/content/legal";
import type { Locale } from "@/i18n/locales";
import { createClient, prismicLocale } from "@/prismicio";

/**
 * The published legal document for this uid and locale, or `null` when none exists.
 *
 * Shared by the page and its metadata so both agree on what is published. Every Prismic
 * query is cached under the shared tag, so the two calls in one request collapse into
 * one fetch.
 */
export async function fetchLegalPage(
  locale: Locale,
  uid: LegalUid,
): Promise<Content.LegalPageDocument | null> {
  try {
    return await createClient().getByUID("legal_page", uid, { lang: prismicLocale(locale) });
  } catch {
    // Nothing published in this locale yet. Unlike the blog, this is not a 404: the page
    // still has to exist and still has to say what the law requires.
    return null;
  }
}
