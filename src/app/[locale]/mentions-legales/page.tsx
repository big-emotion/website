import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { generateLegalMetadata } from "@/components/legal/legal-metadata";
import { LegalPage } from "@/components/legal/legal-page";
import { routing } from "@/i18n/routing";

// LCEN art. 6-III: this page has to exist and stay reachable. It is Prismic-backed like
// the other content routes and deliberately unpinned, so a published correction goes live
// through the revalidation webhook rather than the next deploy (DEC-021).

type RouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return generateLegalMetadata(locale, "mentions-legales");
}

export default async function MentionsLegalesRoute({ params }: RouteProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <LegalPage locale={locale} uid="mentions-legales" />;
}
