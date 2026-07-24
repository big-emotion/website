import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { legalNavLinks } from "@/content/legal";
import type { Locale } from "@/i18n/locales";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";
import { SiteFooter } from "./site-footer";

const usePathname = vi.hoisted(() => vi.fn());
vi.mock("@/i18n/navigation", () => ({
  usePathname,
  Link: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

const messages = { fr: frMessages, en: enMessages };

function renderFooter(locale: Locale = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <SiteFooter locale={locale} legalLinks={legalNavLinks(locale)} />
    </NextIntlClientProvider>,
  );
}

describe("SiteFooter", () => {
  beforeEach(() => {
    // A non-home route: the footer never renders on "/" (FooterSlot withholds it there),
    // so every case here exercises a route that actually shows the band.
    usePathname.mockReturnValue("/approach/");
  });

  it("signs the site with the brand and the manifesto line", () => {
    renderFooter();

    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()} BIG EMOTION`)),
    ).toBeInTheDocument();
    // Body copy, so the French keeps its accents — DEC-023's ASCII rule covers display
    // slots only, and this line is set in the body face.
    expect(screen.getByText(/on crée de l’impact/)).toBeInTheDocument();
  });

  it("signs off in the visitor's language", () => {
    renderFooter("en");

    expect(screen.getByText(/we create impact/)).toBeInTheDocument();
  });

  // Epic precondition 4 (social profile URLs) is still open, and REQ-033 requires a
  // network with no confirmed handle to be omitted rather than linked nowhere — so the
  // icon row stays the decorative sprite, with no anchor of its own. Scoped to the icon
  // row: the legal row below it is anchors by design.
  it("ships no social links while the profile URLs are unconfirmed", () => {
    const { container } = renderFooter();

    const socialSprite = container.querySelector('[role="img"]');
    expect(socialSprite?.querySelector("a")).toBeNull();
    for (const anchor of container.querySelectorAll("a")) {
      expect(anchor.closest("nav")).not.toBeNull();
    }
  });

  it("still shows the seven-network icon row, as a decorative sprite", () => {
    renderFooter();

    expect(
      screen.getByRole("img", {
        name: "Facebook, X, Instagram, YouTube, LinkedIn, TikTok, WhatsApp",
      }),
    ).toBeInTheDocument();
  });

  // It renders on every route, so anything that belongs to one page — the contact
  // details and the form — has to live on /contact instead.
  it("carries no contact surface of its own", () => {
    const { container } = renderFooter();

    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("link", { name: "hello@big-emotion.com" })).not.toBeInTheDocument();
  });

  it("keeps the brand mark decorative, since the brand is already named in the sign-off", () => {
    const { container } = renderFooter();

    // The mark is the logo lockup, hidden from AT; the social sprite (role=img) is the
    // only announced graphic, so scope the query to the decorative subtree.
    expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });

  // LCEN and the RGPD both want the notice permanently reachable, and the footer is the
  // only surface that renders on every route.
  describe("legal row", () => {
    it("reaches all three legal pages from any route", () => {
      renderFooter();

      expect(screen.getByRole("link", { name: "Mentions légales" })).toHaveAttribute(
        "href",
        "/mentions-legales",
      );
      expect(screen.getByRole("link", { name: "Politique de confidentialité" })).toHaveAttribute(
        "href",
        "/politique-de-confidentialite",
      );
      expect(screen.getByRole("link", { name: "Déclaration d'accessibilité" })).toBeInTheDocument();
    });

    it("translates the row with the rest of the page", () => {
      renderFooter("en");

      expect(screen.getByRole("link", { name: "Legal notice" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Privacy policy" })).toBeInTheDocument();
    });

    // A button, not a link: it opens a panel on the current page. Middle-clicking a link
    // that goes nowhere would be worse than no affordance at all.
    it("offers cookie settings as a button", () => {
      renderFooter();

      expect(screen.getByRole("button", { name: "Gestion des cookies" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Gestion des cookies" })).not.toBeInTheDocument();
    });

    it("groups the row as a named landmark", () => {
      renderFooter();

      expect(screen.getByRole("navigation", { name: "Informations legales" })).toBeInTheDocument();
    });
  });

  // The band adopts the accent of the hero it sits under, so /cases closes on tangerine,
  // /culture on lyon and /contact on ink — the same surfaces SubpageHero paints.
  it.each([
    ["/cases/", "bg-tangerine"],
    ["/culture/", "bg-lyon"],
    ["/contact/", "bg-ink"],
    ["/playground/", "bg-brutal"],
    // Effect pages hang off the gallery, so they close on the same grey band.
    ["/playground/lumiere/", "bg-brutal"],
  ])("takes the current page's hero surface (%s → %s)", (pathname, surface) => {
    usePathname.mockReturnValue(pathname);
    const { container } = renderFooter();

    expect(container.querySelector("footer")?.className).toContain(surface);
  });

  // Routes with no accent hero (the legal pages themselves, 404) fall back to lemon
  // rather than rendering an unstyled band.
  it("falls back to the lemon surface off the accent routes", () => {
    usePathname.mockReturnValue("/mentions-legales/");
    const { container } = renderFooter();

    expect(container.querySelector("footer")?.className).toContain("bg-lemon");
  });
});
