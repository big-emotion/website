import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FooterSlot } from "@/components/footer-slot";
import { PrismicToolbar } from "@/components/prismic/prismic-toolbar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { legalNavLinks } from "@/content/legal";
import { content, site } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import {
  alternateLanguages,
  localePath,
  localeUrl,
  openGraphLocales,
  SITE_ORIGIN,
} from "@/i18n/urls";
import { DocumentShell } from "../document-shell";

// Both locales are known at build time, so the marketing tree stays fully SSG.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const { meta } = content[locale];

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: { default: meta.title, template: "%s — BIG EMOTION" },
    description: meta.description,
    alternates: {
      canonical: localePath(locale, "/"),
      languages: alternateLanguages("/"),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      url: localeUrl(locale, "/"),
      title: meta.title,
      description: meta.description,
      // The share card itself comes from `app/opengraph-image.tsx` via the file
      // convention, which Next resolves against the rendered route — so it is advertised
      // at `/fr/opengraph-image` and `/en/opengraph-image`. The French one redirects to
      // the unprefixed card; both end at the same PNG. Setting `images` here does not
      // override it: the file convention wins.
      ...openGraphLocales(locale),
    },
  };
}

// Organization structured data — lets search engines recognise the brand entity.
// Sourced from src/content/site.ts so it can't drift from the visible contact info.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/icon.svg`,
  email: site.contact.email,
  telephone: site.contact.phone,
  founder: { "@type": "Person", name: site.contact.person },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // The segment is also what unknown top-level paths fall into, so it is validated
  // rather than trusted — `/nonsense` must 404, not render as a locale.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts the marketing tree back into static rendering: without it every next-intl
  // call reads headers() and the pages silently become dynamic.
  setRequestLocale(locale);

  const t = await getTranslations("layout");

  return (
    <DocumentShell lang={locale} skipLabel={t("skipToContent")}>
      <NextIntlClientProvider>
        <SiteHeader locale={locale as Locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <FooterSlot>
          <SiteFooter locale={locale as Locale} legalLinks={legalNavLinks(locale as Locale)} />
        </FooterSlot>
      </NextIntlClientProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Preview machinery for editors. It has to render on every previewable page,
          which is why it sits in the layout rather than on the Prismic-backed routes
          themselves. Outside a draft-mode session it contributes no third-party
          request at all — see the component for why that matters. */}
      <PrismicToolbar />
    </DocumentShell>
  );
}
