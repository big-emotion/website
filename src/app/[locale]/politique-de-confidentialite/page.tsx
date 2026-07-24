import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { generateLegalMetadata } from "@/components/legal/legal-metadata";
import { LegalPage } from "@/components/legal/legal-page";
import { routing } from "@/i18n/routing";

// RGPD art. 13: the notice owed to anyone whose data the contact form or the client area
// collects. Also the page tarteaucitron links to from the consent banner.

type RouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return generateLegalMetadata(locale, "politique-de-confidentialite");
}

export default async function PolitiqueDeConfidentialiteRoute({ params }: RouteProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <LegalPage locale={locale} uid="politique-de-confidentialite" />;
}
