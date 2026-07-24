import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fr from "../../messages/fr.json";
import { LocaleSwitcher } from "./locale-switcher";

// Partial: `localePath` reaches for the real `getPathname` from this same module, so
// only the hook is stubbed — replacing the module wholesale would take that with it.
vi.mock("@/i18n/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/i18n/navigation")>()),
  usePathname: () => "/cases",
}));

function renderSwitcher(locale: "fr" | "en" = "fr") {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <LocaleSwitcher locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitcher", () => {
  it("deep-links the very page being read, in each locale", () => {
    renderSwitcher();

    // Whatever `localePath` decides about the trailing slash is its own contract
    // (i18n/urls.test.ts owns that) — what matters here is that both options point at
    // this page rather than at either locale's home.
    expect(screen.getByRole("link", { name: /FR/ })).toHaveAttribute("href", "/cases");
    expect(screen.getByRole("link", { name: /EN/ })).toHaveAttribute("href", "/en/cases");
  });

  // "You are here" is dimmed and the actionable option reads full strength — the same
  // grammar the nav links beside it already use (`aria-[current=page]:opacity-40`).
  // It shipped inverted, which dimmed the only option worth clicking.
  it("dims the locale already being read, not the one you can switch to", () => {
    renderSwitcher("fr");

    expect(screen.getByRole("link", { name: /FR/ }).className).toContain(
      "aria-[current=true]:opacity-40",
    );
    expect(screen.getByRole("link", { name: /FR/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /EN/ })).not.toHaveAttribute("aria-current");
  });

  it("moves the current marker with the locale", () => {
    renderSwitcher("en");

    expect(screen.getByRole("link", { name: /EN/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /FR/ })).not.toHaveAttribute("aria-current");
  });
});
