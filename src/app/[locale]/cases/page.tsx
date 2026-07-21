import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cases } from "@/components/sections/cases";
import { SubpageHero } from "@/components/subpage-hero";
import { content } from "@/content/site";
import { routing } from "@/i18n/routing";
import { sectionMetadata } from "../section-metadata";

const ROUTE = "/cases";

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

  return (
    <>
      <SubpageHero page="cases" title={title} lead={leads.cases} />
      <Cases locale={locale} />
    </>
  );
}
