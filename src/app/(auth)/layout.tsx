import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { defaultLocale } from "@/i18n/locales";
import { SITE_ORIGIN } from "@/i18n/urls";
import { DocumentShell } from "../document-shell";

// Declared per root layout rather than once at the top of the tree: `[locale]` is a
// dynamic segment, so there is no shared root layout to inherit this from. Without it
// the share card from `app/opengraph-image.tsx` resolves against localhost.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
};

/**
 * Root layout for the client-area sign-in surface.
 *
 * The espace is French-only and sits outside locale routing (REQ-030), so this tree
 * needs its own `<html>` — `[locale]/layout.tsx` can't provide one for a path that
 * never carries a locale segment. It deliberately skips the marketing header and
 * footer: this is a focused auth flow, and the site nav would only invite the visitor
 * to wander off mid sign-in. The wordmark stays as the way back out.
 */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <DocumentShell lang={defaultLocale} skipLabel="Aller au contenu">
      <header className="px-5 py-4 md:px-8 md:py-5">
        <Link href="/" aria-label="BIG EMOTION — accueil">
          <Wordmark className="text-[1.45rem] md:text-2xl" />
        </Link>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </DocumentShell>
  );
}
