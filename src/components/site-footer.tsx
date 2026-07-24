"use client";

import { useTranslations } from "next-intl";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import type { LegalNavLink } from "@/content/legal";
import { content, site } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./logo";
import { SocialSprite } from "./social-sprite";
import { SUBPAGE_ACCENTS, subpageFromPathname } from "./subpage-accents";

// Off the accent routes (legal pages, 404) there is no hero to echo, so the band keeps
// the lemon it shipped with rather than rendering unstyled.
const DEFAULT_SURFACE = "bg-lemon text-ink";

// Site-wide furniture only. The contact surface moved to /contact (SWBE-21) — the layout
// renders this footer on every route (except home, withheld by FooterSlot), so anything
// page-specific cannot live here.
//
// A client component because the band echoes the current page's hero accent, and only
// the pathname tells it which hero it sits under. `bg`/ink come as one token pair
// (SUBPAGE_ACCENTS.surface) so the ink stays legible on whichever surface is picked —
// text-ink on lemon/tangerine, text-paper on lyon, text-lemon on ink.
export function SiteFooter({
  locale,
  legalLinks,
}: {
  locale: Locale;
  /** Resolved on the server — see `legalNavLinks` for why they are not imported here. */
  legalLinks: readonly LegalNavLink[];
}) {
  const { footerLegal } = content[locale];
  const t = useTranslations("layout");
  const subpage = subpageFromPathname(usePathname());
  const surface = subpage ? SUBPAGE_ACCENTS[subpage].surface : DEFAULT_SURFACE;

  const privacyHref = legalLinks.find(
    (link) => link.uid === "politique-de-confidentialite",
  )?.href;

  return (
    <footer className={surface}>
      <div className="flex flex-col items-center gap-8 px-5 py-10 text-center md:grid md:grid-cols-3 md:items-center md:gap-4 md:px-8 md:text-left">
        {/* Decorative: the brand name is already spelled out in the sign-off, so hide the
            mark from assistive tech. */}
        <span aria-hidden="true" className="md:justify-self-start">
          <Logo className="h-9 w-auto md:h-10" />
        </span>

        {/* Unlinked sprite, keyed to the surface ink — split into real anchors the day the
            profile URLs land (REQ-033). */}
        <SocialSprite className="h-6 w-auto md:h-7 md:justify-self-center" />

        <p className="max-w-[26ch] text-sm md:justify-self-end md:text-right">
          © {new Date().getFullYear()} {site.name}. {footerLegal}
        </p>
      </div>

      {/* The obligatory row (SWBE-34). Reachable from every page, which is the whole
          point of it living in the footer: LCEN and the RGPD both ask for the notice to
          be permanently available, not filed somewhere a reader has to hunt for.
          `border-current` picks up whichever ink the surface chose. */}
      <nav aria-label={t("legalNav")} className="border-t border-current/20 px-5 py-6 md:px-8">
        <ul className="flex flex-col items-center gap-3 text-sm md:flex-row md:flex-wrap md:justify-center md:gap-x-8 md:gap-y-2">
          {legalLinks.map((link) => (
            <li key={link.uid}>
              <Link href={link.href} className="underline underline-offset-4">
                {link.label}
              </Link>
            </li>
          ))}
          {privacyHref && (
            <li>
              <CookieSettingsButton
                locale={locale}
                privacyHref={privacyHref}
                className="underline underline-offset-4"
              />
            </li>
          )}
        </ul>
      </nav>
    </footer>
  );
}
