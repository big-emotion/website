import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cases } from "@/components/sections/cases";
import { SubpageHero } from "@/components/subpage-hero";
import { content } from "@/content/site";
import { routing } from "@/i18n/routing";
import { createClient, prismicLocale } from "@/prismicio";
import { sectionMetadata } from "../section-metadata";

const ROUTE = "/cases";

// Prismic is read at build time only, never per request: publishing a case study takes a
// rebuild + deploy. Without this the client's uncached fetch would opt the route into
// dynamic rendering and put a Prismic round-trip on every visit.
export const dynamic = "force-static";

type RouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return sectionMetadata(locale, ROUTE, content[locale].leads.cases);
}

export default async function CasesPage({ params }: RouteProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Static rendering only holds while the locale is declared up front — without this
  // every next-intl call below reads headers() and the route turns dynamic.
  setRequestLocale(locale);

  const { scenes, leads } = content[locale];
  const title = scenes.find((scene) => scene.id === "cases")?.title ?? [];

  // Oldest first, so the running order is the one the studies were published in rather
  // than whatever the API happens to return.
  const caseStudies = await createClient().getAllByType("case_study", {
    lang: prismicLocale(locale),
    orderings: [{ field: "document.first_publication_date", direction: "asc" }],
  });

  return (
    <>
      <SubpageHero page="cases" title={title} lead={leads.cases} />
      <Cases locale={locale} caseStudies={caseStudies} />
    </>
  );
}
