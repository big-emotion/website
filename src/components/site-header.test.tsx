import { fireEvent, render, screen, within } from "@testing-library/react";
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
  it("opens on the burger and closes on the same button", () => {
    renderHeader("fr");
    const toggle = screen.getByRole("button", { name: frMessages.header.openMenu });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const drawer = openDrawer("fr");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      within(drawer).getByRole("link", { name: content.fr.nav[0].label }),
    ).toBeInTheDocument();

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
    ["/approach/", "text-ink"],
    ["/cases/", "text-ink"],
    ["/culture/", "text-paper"],
    ["/contact/", "text-lemon"],
  ])("takes the hero's ink on %s", (pathname, ink) => {
    const { container } = renderHeader("fr", pathname);

    expect(container.querySelector("header")).toHaveClass(ink);
  });

  it("keeps the default ink on the home page, which has no accent hero", () => {
    const { container } = renderHeader("fr", "/");

    expect(container.querySelector("header")).toHaveClass("text-ink");
  });
});
