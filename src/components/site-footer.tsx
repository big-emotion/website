import { content, site } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { Wordmark } from "./wordmark";

// Site-wide furniture only. The contact surface moved to /contact (SWBE-21) — the layout
// renders this footer on every route, so anything page-specific cannot live here.
export function SiteFooter({ locale }: { locale: Locale }) {
  const { footerLegal } = content[locale];

  return (
    <footer className="bg-lemon text-ink">
      <div className="px-5 pt-16 pb-10 md:px-8 md:pt-24">
        {/* Oversized wordmark — the brand's signature footer move. Purely decorative
            here (the brand name is already in the copyright line), so hide it from AT. */}
        <span aria-hidden="true">
          <Wordmark
            stacked={false}
            className="block w-full text-[22vw] leading-none md:text-[16vw]"
          />
        </span>

        <p className="mt-6 text-sm">
          © {new Date().getFullYear()} {site.name}. {footerLegal}
        </p>
      </div>
    </footer>
  );
}
