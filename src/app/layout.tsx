import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LoadScreen } from "@/components/load-screen";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";

// Fonts are self-hosted (woff2 committed under ./fonts) rather than fetched from
// Google at build time: keeps the static export build offline-reproducible and means
// no visitor request ever hits Google (GDPR-friendly). Source files come from the
// @fontsource-variable/* packages.

// Display: the brand "BBH" is a heavy grotesque (not libre under that name); Archivo
// Variable is the closest free match (weight axis 100–900).
const display = localFont({
  src: "./fonts/archivo-latin.woff2",
  variable: "--font-bbh",
  weight: "100 900",
  display: "swap",
});

// Body copy per the guidelines: Bricolage Grotesque (variable weight 200–800).
const body = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://big-emotion.com"),
  title: {
    default: "BIG EMOTION — The B!G agency that gives a wow.",
    template: "%s — BIG EMOTION",
  },
  description:
    "On ne fait pas des sites web. On crée de l’impact. Agence digitale : vraie identité, émotion brute.",
  alternates: { canonical: "/" },
};

// Organization structured data — lets search engines recognise the brand entity.
// Sourced from src/content/site.ts so it can't drift from the visible contact info.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: "https://big-emotion.com",
  logo: "https://big-emotion.com/icon.svg",
  email: site.contact.email,
  telephone: site.contact.phone,
  founder: { "@type": "Person", name: site.contact.person },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Aller au contenu
        </a>
        <LoadScreen />
        <SiteHeader />
        <main id="main" className="flex-1 scroll-mt-24">
          {children}
        </main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
