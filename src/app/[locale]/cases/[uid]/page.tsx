import { asText } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { SliceZone } from "@prismicio/react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { locales } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { alternateLanguages, localePath, localeUrl, openGraphLocales } from "@/i18n/urls";
import { createClient, prismicLocale } from "@/prismicio";
import { components } from "@/slices";

// Same build-time-only contract as the listing: a new case study reaches the site
// through a rebuild, not through a request.
export const dynamic = "force-static";

type RouteProps = { params: Promise<{ locale: string; uid: string }> };

export async function generateStaticParams() {
  const client = createClient();

  return (
    await Promise.all(
      locales.map(async (locale) =>
        (await client.getAllByType("case_study", { lang: prismicLocale(locale) })).map(
          (caseStudy) => ({ locale, uid: caseStudy.uid! }),
        ),
      ),
    )
  ).flat();
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale, uid } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const caseStudy = await fetchCaseStudy(locale, uid);
  // `asText` yields null for an empty rich-text field; Open Graph wants it absent.
  const description = asText(caseStudy.data.summary) ?? undefined;
  const href = `/cases/${uid}`;

  return {
    title: caseStudy.data.title,
    description,
    alternates: {
      canonical: localePath(locale, href),
      languages: alternateLanguages(href),
    },
    openGraph: {
      type: "article",
      siteName: site.name,
      url: localeUrl(locale, href),
      title: caseStudy.data.title ?? undefined,
      description,
      ...openGraphLocales(locale),
    },
  };
}

export default async function CaseStudyPage({ params }: RouteProps) {
  const { locale, uid } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const caseStudy = await fetchCaseStudy(locale, uid);
  const { title, client, kind, summary, cover, body } = caseStudy.data;

  return (
    <article className="bg-lyon px-5 py-20 text-paper md:px-8 md:py-32">
      <p className="font-display text-sm uppercase tracking-wide opacity-70">{client || kind}</p>
      <h1 className="font-display mt-2 text-[clamp(2.25rem,9vw,7rem)] text-lemon [overflow-wrap:anywhere]">
        {title}
      </h1>
      <p className="mt-6 max-w-prose text-lg leading-relaxed">{asText(summary)}</p>

      {/* Full width on mobile, half the grid from md up — the same rhythm as the cards
          this page is opened from. */}
      <PrismicNextImage
        field={cover}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="mt-10 h-auto w-full"
      />

      <SliceZone slices={body} components={components} />
    </article>
  );
}

async function fetchCaseStudy(locale: (typeof locales)[number], uid: string) {
  try {
    return await createClient().getByUID("case_study", uid, { lang: prismicLocale(locale) });
  } catch {
    // A uid with no document in this locale is a 404, not a build failure — the same
    // answer an unknown path gets, so an untranslated study can't leak its existence.
    notFound();
  }
}
