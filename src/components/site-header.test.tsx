// @req REQ-003
// @req REQ-036

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";
import { content, espaceB2bHref } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The header decides an href; `next/link` then rewrites it to match `trailingSlash`
// from next.config.ts, which a unit test never loads. A passthrough anchor keeps these
// assertions on the destination the header picked, not on Next's URL normalisation.
vi.mock("next/link", () => ({
  default: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

// The current path is the locale switcher's only input, so each test drives it to
// prove the switcher lands on the same page in the other locale.
const { currentPathname } = vi.hoisted(() => ({ currentPathname: { value: "/" } }));
vi.mock("@/i18n/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/i18n/navigation")>()),
  usePathname: () => currentPathname.value,
}));

import { SiteHeader } from "./site-header";

const messages = { fr: frMessages, en: enMessages };

function renderHeader(locale: Locale, pathname = "/") {
  currentPathname.value = pathname;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <SiteHeader locale={locale} />
    </NextIntlClientProvider>,
  );
}

function switcher(locale: Locale, container: HTMLElement = document.body) {
  return within(
    within(container).getByRole("group", { name: messages[locale].header.languageSwitcher }),
  );
}

function openDrawer(locale: Locale) {
  fireEvent.click(screen.getByRole("button", { name: messages[locale].header.openMenu }));
  return screen.getByRole("navigation", { name: messages[locale].header.mainMenu });
}

describe("SiteHeader navigation", () => {
  it("points the French nav at the unprefixed section routes", () => {
    renderHeader("fr");

    for (const item of content.fr.nav) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
  });

  it("keeps English visitors under /en on every nav destination", () => {
    renderHeader("en");

    for (const item of content.en.nav) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        `/en${item.href}`,
      );
    }
  });

  it("sends the wordmark home in the active locale", () => {
    renderHeader("en");

    expect(screen.getByRole("link", { name: enMessages.header.home })).toHaveAttribute(
      "href",
      "/en",
    );
  });

  it("links the Espace B2B CTA out to the b2b space in a new tab", () => {
    renderHeader("fr");

    const cta = screen.getByRole("link", { name: content.fr.espaceB2bLabel });
    expect(cta).toHaveAttribute("href", espaceB2bHref);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses 15px Bricolage for the desktop navigation", () => {
    renderHeader("fr");

    const firstDestination = screen.getByRole("link", { name: content.fr.nav[0].label });
    const cta = screen.getByRole("link", { name: content.fr.espaceB2bLabel });
    const localeOption = switcher("fr").getByRole("link", { name: /Francais/ });

    expect(firstDestination).toHaveClass("font-body", "text-[15px]", "font-medium");
    expect(firstDestination).not.toHaveClass("font-display");
    expect(cta).toHaveClass("font-body", "text-[15px]", "font-medium");
    expect(localeOption).toHaveClass("font-body", "text-[15px]", "font-medium");
    expect(cta).not.toHaveClass("border-2");
  });

  it("keeps the compact menu through tablet widths", () => {
    renderHeader("fr");

    const firstDestination = screen.getByRole("link", { name: content.fr.nav[0].label });
    const desktopNav = firstDestination.closest("nav");
    const toggle = screen.getByRole("button", { name: frMessages.header.openMenu });

    expect(desktopNav).toHaveClass("hidden", "min-[1200px]:flex");
    expect(desktopNav).not.toHaveClass("md:flex", "xl:flex");
    expect(toggle).toHaveClass("min-[1200px]:hidden");
    expect(toggle).not.toHaveClass("md:hidden", "xl:hidden");
  });
});

// The maquette dims the link of the page you are already on ("you are here"). The dim is
// keyed off aria-current="page", which is the real contract: it both announces the current
// page to assistive tech and gives the CSS its styling hook.
describe("SiteHeader current-page marker", () => {
  const navItem = (href: string) => content.fr.nav.find((item) => item.href === href)!;

  it("marks the nav link of the page you are on as current", () => {
    renderHeader("fr", "/contact/");

    expect(screen.getByRole("link", { name: navItem("/contact").label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: navItem("/approach").label })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the section link even on a nested route below it", () => {
    renderHeader("fr", "/cases/some-study/");

    expect(screen.getByRole("link", { name: navItem("/cases").label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks nothing on the home page, which is not a nav destination", () => {
    renderHeader("fr", "/");

    for (const item of content.fr.nav) {
      expect(screen.getByRole("link", { name: item.label })).not.toHaveAttribute("aria-current");
    }
  });

  it("marks the current page inside the mobile drawer too", () => {
    renderHeader("fr", "/culture/");
    const drawer = openDrawer("fr");

    expect(within(drawer).getByRole("link", { name: navItem("/culture").label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("SiteHeader locale switcher", () => {
  it("offers the current page in the other locale, both ways", () => {
    const { unmount } = renderHeader("fr", "/cases/");
    expect(switcher("fr").getByRole("link", { name: /Anglais/ })).toHaveAttribute(
      "href",
      "/en/cases/",
    );
    unmount();

    renderHeader("en", "/cases/");
    expect(switcher("en").getByRole("link", { name: /French/ })).toHaveAttribute("href", "/cases/");
  });

  it("marks the active locale so assistive tech announces it", () => {
    renderHeader("fr", "/culture/");

    expect(switcher("fr").getByRole("link", { current: true })).toHaveAccessibleName(/Francais/);
  });

  it("repeats the switcher inside the mobile drawer", () => {
    renderHeader("en", "/approach/");

    expect(switcher("en", openDrawer("en")).getByRole("link", { name: /French/ })).toHaveAttribute(
      "href",
      "/approach/",
    );
  });
});

describe("SiteHeader mobile drawer", () => {
  it("uses a compact Bricolage treatment in the mobile drawer", () => {
    renderHeader("fr");
    const drawer = openDrawer("fr");

    expect(within(drawer).getByRole("link", { name: content.fr.nav[0].label })).toHaveClass(
      "font-body",
      "text-3xl",
    );
    expect(within(drawer).getByRole("link", { name: content.fr.espaceB2bLabel })).toHaveClass(
      "font-body",
      "text-xl",
    );
  });

  it("opens on the burger and closes on the same button", () => {
    renderHeader("fr");
    const toggle = screen.getByRole("button", { name: frMessages.header.openMenu });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const drawer = openDrawer("fr");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(within(drawer).getByRole("link", { name: content.fr.nav[0].label })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: frMessages.header.closeMenu }));
    expect(
      screen.queryByRole("navigation", { name: frMessages.header.mainMenu }),
    ).not.toBeInTheDocument();
  });

  it("closes once a destination is tapped", () => {
    renderHeader("fr");
    const drawer = openDrawer("fr");

    fireEvent.click(within(drawer).getByRole("link", { name: content.fr.nav[0].label }));

    expect(
      screen.queryByRole("navigation", { name: frMessages.header.mainMenu }),
    ).not.toBeInTheDocument();
  });

  it("closes on Escape and hands focus back to the burger", () => {
    renderHeader("fr");
    const toggle = screen.getByRole("button", { name: frMessages.header.openMenu });
    openDrawer("fr");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("navigation", { name: frMessages.header.mainMenu }),
    ).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it("repeats the Espace B2B CTA inside the drawer", () => {
    renderHeader("fr");

    expect(
      within(openDrawer("fr")).getByRole("link", { name: content.fr.espaceB2bLabel }),
    ).toHaveAttribute("href", espaceB2bHref);
  });
});

// The header is fixed over the sub-page hero, which paints its own accent. It is
// rendered by the layout, so it cannot inherit that accent — it has to resolve it from
// the path. Getting this wrong is invisible in a unit test but fatal on screen:
// /contact/'s hero is ink, so the default ink header would be black on black.
describe("SiteHeader over a sub-page hero", () => {
  it.each([
    ["/approach/", "text-ink", "bg-lemon"],
    ["/cases/", "text-ink", "bg-tangerine"],
    ["/culture/", "text-paper", "bg-lyon"],
    ["/contact/", "text-lemon", "bg-ink"],
    // The blog is the one section whose ink is not a fixed token: it wears a whole
    // association, drawn per article, so the bar follows the custom property both
    // surfaces set (src/components/blog/brand-pairings.ts).
    ["/blog/", "text-[var(--blog-ink)]", "bg-[var(--blog-surface)]"],
    ["/blog/some-article/", "text-[var(--blog-ink)]", "bg-[var(--blog-surface)]"],
  ])("takes the hero's complete colour pairing on %s", (pathname, ink, surface) => {
    const { container } = renderHeader("fr", pathname);

    expect(container.querySelector("header")).toHaveClass(ink);
    expect(container.querySelector("header")).toHaveClass(surface);
  });

  it("keeps the home header and its Espace B2B link transparent", async () => {
    const finalSurface = document.createElement("section");
    finalSurface.dataset.headerInk = "text-ink";
    finalSurface.dataset.headerSurface = "bg-paper";
    vi.spyOn(finalSurface, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.body.append(finalSurface);

    try {
      const { container } = renderHeader("fr", "/");
      const header = container.querySelector("header");
      const cta = screen.getByRole("link", { name: content.fr.espaceB2bLabel });

      await waitFor(() => expect(header).toHaveClass("text-ink"));
      expect(header).toHaveClass("text-ink", "bg-transparent");
      expect(header).not.toHaveClass("bg-paper");
      expect(cta.className).not.toMatch(/\bbg-/);
    } finally {
      finalSurface.remove();
    }
  });

  // REQ-036: the resting header over the blog must not fall back to the black default,
  // which measured 2.12:1 on the blue the section used to be. Taking the association's
  // own ink settles it for every pair rather than for that one surface — that the ink
  // clears 4.5:1 on its surface is what brand-pairings.test.ts asserts, against the real
  // palette. Matching the background as well prevents article copy from showing through
  // the fixed navigation while preserving the selected pairing.
  it("meets AA at rest over /blog/ with the article's complete pairing", () => {
    const { container } = renderHeader("fr", "/blog/");
    const header = container.querySelector("header");

    expect(header).not.toHaveClass("text-ink");
    expect(header).toHaveClass("bg-[var(--blog-surface)]");
  });

  it("takes the complete pairing declared by the surface passing under it", async () => {
    const surface = document.createElement("section");
    surface.dataset.headerInk = "text-lemon";
    surface.dataset.headerSurface = "bg-ink";
    vi.spyOn(surface, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.body.append(surface);

    const { container } = renderHeader("fr", "/approach/");

    await waitFor(() =>
      expect(container.querySelector("header")).toHaveClass("text-lemon", "bg-ink"),
    );
    surface.remove();
  });
});
