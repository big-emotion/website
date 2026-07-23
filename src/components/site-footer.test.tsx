import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "./site-footer";

const usePathname = vi.hoisted(() => vi.fn());
vi.mock("@/i18n/navigation", () => ({ usePathname }));

describe("SiteFooter", () => {
  beforeEach(() => {
    // A non-home route: the footer never renders on "/" (FooterSlot withholds it there),
    // so every case here exercises a route that actually shows the band.
    usePathname.mockReturnValue("/approach/");
  });

  it("signs the site with the brand and the manifesto line", () => {
    render(<SiteFooter locale="fr" />);

    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()} BIG EMOTION`)),
    ).toBeInTheDocument();
    // Body copy, so the French keeps its accents — DEC-023's ASCII rule covers display
    // slots only, and this line is set in the body face.
    expect(screen.getByText(/on crée de l’impact/)).toBeInTheDocument();
  });

  it("signs off in the visitor's language", () => {
    render(<SiteFooter locale="en" />);

    expect(screen.getByText(/we create impact/)).toBeInTheDocument();
  });

  // Epic precondition 4 (social profile URLs) is still open, and REQ-033 requires a
  // network with no confirmed handle to be omitted rather than linked nowhere — so the
  // icon row stays the decorative sprite, with zero anchors.
  it("ships no social links while the profile URLs are unconfirmed", () => {
    const { container } = render(<SiteFooter locale="fr" />);

    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("still shows the seven-network icon row, as a decorative sprite", () => {
    render(<SiteFooter locale="fr" />);

    expect(
      screen.getByRole("img", {
        name: "Facebook, X, Instagram, YouTube, LinkedIn, TikTok, WhatsApp",
      }),
    ).toBeInTheDocument();
  });

  // It renders on every route, so anything that belongs to one page — the contact
  // details and the form — has to live on /contact instead.
  it("carries no contact surface of its own", () => {
    const { container } = render(<SiteFooter locale="fr" />);

    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("link", { name: "hello@big-emotion.com" })).not.toBeInTheDocument();
  });

  it("keeps the wordmark decorative, since the brand is already named in the sign-off", () => {
    const { container } = render(<SiteFooter locale="fr" />);

    const wordmark = container.querySelector('[aria-label="BIG EMOTION"]');
    expect(wordmark?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  // The band adopts the accent of the hero it sits under, so /cases closes on tangerine,
  // /culture on lyon and /contact on ink — the same surfaces SubpageHero paints.
  it.each([
    ["/cases/", "bg-tangerine"],
    ["/culture/", "bg-lyon"],
    ["/contact/", "bg-ink"],
  ])("takes the current page's hero surface (%s → %s)", (pathname, surface) => {
    usePathname.mockReturnValue(pathname);
    const { container } = render(<SiteFooter locale="fr" />);

    expect(container.querySelector("footer")?.className).toContain(surface);
  });

  // Routes with no accent hero (legal pages, 404) fall back to lemon rather than
  // rendering an unstyled band.
  it("falls back to the lemon surface off the accent routes", () => {
    usePathname.mockReturnValue("/legal/");
    const { container } = render(<SiteFooter locale="fr" />);

    expect(container.querySelector("footer")?.className).toContain("bg-lemon");
  });
});
