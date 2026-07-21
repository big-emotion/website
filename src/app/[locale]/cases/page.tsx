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

// Deliberately unpinned. The page still pre-renders — the Prismic client caches its
// queries — but the publish webhook drops that cache tag so the next request regenerates
// it (SWBE-80). `force-static` would freeze the output until the next deploy, which is
// exactly the rebuild-to-publish behaviour this story removes.

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

  // Ordered by an explicit editorial field, not by publication date: the studies were
  // all published in one release, so their timestamps tie and the resulting order would
  // be arbitrary — and could differ between two builds of the same content.
  const caseStudies = await createClient().getAllByType("case_study", {
    lang: prismicLocale(locale),
    orderings: [{ field: "my.case_study.display_order", direction: "asc" }],
  });

  return (
    <>
      <SubpageHero page="cases" title={title} lead={leads.cases} />
      <Cases locale={locale} caseStudies={caseStudies} />
    </>
  );
}
