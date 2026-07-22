import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type { Locale } from "@/i18n/locales";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";

vi.mock("next/link", () => ({
  default: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

import { FeaturedArticle } from "./featured-article";

const messages = { fr: frMessages, en: enMessages };

function renderFeatured(
  props: Partial<React.ComponentProps<typeof FeaturedArticle>> = {},
  locale: Locale = "fr",
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <FeaturedArticle
        href="/blog/ferry"
        label="À la une"
        title="Ferry : une carte Jira bouge, une pull request arrive"
        excerpt="Cinq agents branchés sur les colonnes d’un board Jira."
        date="21 juillet 2026"
        readMore="Lire l’article"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe("FeaturedArticle", () => {
  it("promotes the title to a level-2 heading linking to the article", () => {
    renderFeatured();

    expect(screen.getByRole("heading", { name: /ferry/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ferry/i })).toHaveAttribute("href", "/blog/ferry");
  });

  it("shows the featured label, date and excerpt", () => {
    renderFeatured();

    expect(screen.getByText("À la une")).toBeInTheDocument();
    expect(screen.getByText("21 juillet 2026")).toBeInTheDocument();
    expect(screen.getByText(/cinq agents/i)).toBeInTheDocument();
  });

  it("offers a read-more CTA pointing at the same article", () => {
    renderFeatured();

    expect(screen.getByRole("link", { name: "Lire l’article" })).toHaveAttribute(
      "href",
      "/blog/ferry",
    );
  });

  it("prefixes both links on the English route", () => {
    renderFeatured({ readMore: "Read the article" }, "en");

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/en/blog/ferry");
    }
  });
});
