import "./globals.css";

import localFont from "next/font/local";

// Fonts are self-hosted (woff2 committed under ./fonts) rather than fetched from
// Google at build time: keeps the build offline-reproducible and means no visitor
// request ever hits Google (GDPR-friendly). Source files come from the
// @fontsource-variable/* packages.

// Display: BBH (Studio DRAMA), the brand's own display face — confirmed libre on Google
// Fonts 2026-07-20 (DEC-023, supersedes DEC-008's "not libre" premise). The charter
// ships it as three separate width cuts rather than one variable axis, and calls the
// interplay between them the signature: a single headline sets "WE" condensed, "CREATE"
// regular and "IMPACT" extended (brand/BRAND.md §2). All three are declared here; a
// browser only fetches the ones a page actually sets text in.
//
// All three carry the same 121-glyph ASCII-only cmap, so the no-accents-in-display rule
// holds for every cut, not just Hegarty.
const display = localFont({
  src: "./fonts/bbh-hegarty-latin.woff2",
  variable: "--font-bbh",
  weight: "400",
  style: "normal",
  display: "swap",
});

const displayCondensed = localFont({
  src: "./fonts/bbh-bogle-latin.woff2",
  variable: "--font-bbh-condensed",
  weight: "400",
  style: "normal",
  display: "swap",
});

const displayExtended = localFont({
  src: "./fonts/bbh-bartle-latin.woff2",
  variable: "--font-bbh-extended",
  weight: "400",
  style: "normal",
  display: "swap",
});

// Body copy per the guidelines: Bricolage Grotesque (variable weight 200–800).
const body = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

/**
 * The `<html>`/`<body>` document chrome, shared by every root layout.
 *
 * `[locale]` is a top-level dynamic segment, so `<html lang>` has to be decided inside
 * it — which means the app has no single root layout any more. The localized marketing
 * tree and the French-only auth tree each own one, and both delegate the document
 * itself here so the fonts are declared once.
 */
export function DocumentShell({
  lang,
  skipLabel,
  children,
}: Readonly<{
  lang: string;
  skipLabel: string;
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={lang}
      className={`${display.variable} ${displayCondensed.variable} ${displayExtended.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          {skipLabel}
        </a>
        {children}
      </body>
    </html>
  );
}
