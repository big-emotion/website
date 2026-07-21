import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoadScreen } from "@/components/load-screen";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { content, site } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { alternateLanguages, localePath, localeUrl, openGraphLocales, SITE_ORIGIN } from "@/i18n/urls";
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
        <LoadScreen />
        <SiteHeader locale={locale as Locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale as Locale} />
      </NextIntlClientProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </DocumentShell>
  );
}
