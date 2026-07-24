import { asText } from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import {
  LEGAL_FALLBACK_UPDATED_AT,
  legalChrome,
  legalContent,
  type LegalUid,
} from "@/content/legal";
import type { Locale } from "@/i18n/locales";
import { formatArticleDate } from "@/lib/display-date";
import { linkResolver } from "@/prismicio";
import { hasPublishedBody } from "./legal-body";
import { fetchLegalPage } from "./legal-document";

/**
 * The three legal routes, rendered from one component because they differ only by uid.
 *
 * Prismic owns the published wording; `src/content/legal.ts` owns the mandatory minimum
 * that renders while no document exists. Which one a request gets is decided by
 * `hasPublishedBody` — never by whether the fetch happened to succeed, so an editor who
 * clears the body cannot take the page's legal content down with it.
 */
export async function LegalPage({ locale, uid }: { locale: Locale; uid: LegalUid }) {
  const legalPage = await fetchLegalPage(locale, uid);
  const fallback = legalContent[locale][uid];

  const body = legalPage?.data.body;
  const isPublished = hasPublishedBody(asText(body));

  const title = (isPublished && legalPage?.data.title) || fallback.title;
  const updatedAt = (isPublished && legalPage?.data.updated_at) || LEGAL_FALLBACK_UPDATED_AT;

  return (
    <article className="px-5 py-20 md:px-8 md:py-28">
      {/* Body face, not `font-display`: BBH Hegarty is ASCII-only (DEC-023) and these
          titles carry accents that must render correctly. */}
      <h1 className="max-w-[20ch] text-[clamp(2rem,1.6rem+3vw,3rem)] font-bold leading-[1.1] tracking-tight">
        {title}
      </h1>

      <p className="mt-4 text-sm opacity-70">
        {legalChrome[locale].updatedAt} : {formatArticleDate(locale, updatedAt)}
      </p>

      <div className="legal-prose mt-12">
        {isPublished && body ? (
          <PrismicRichText field={body} linkResolver={linkResolver} />
        ) : (
          fallback.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))
        )}
      </div>
    </article>
  );
}
