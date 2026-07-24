import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { generateLegalMetadata } from "@/components/legal/legal-metadata";
import { LegalPage } from "@/components/legal/legal-page";
import { routing } from "@/i18n/routing";

// Voluntary, unlike the two pages beside it: the RGAA declaration duty binds public
// bodies, not a private agency. It ships because the agency sells accessible engineering,
// and it claims no conformance level it has not measured.

type RouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return generateLegalMetadata(locale, "accessibilite");
}

export default async function AccessibiliteRoute({ params }: RouteProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <LegalPage locale={locale} uid="accessibilite" />;
}
