import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type { Locale } from "@/i18n/locales";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";

// `next/link` rewrites hrefs to match `trailingSlash` from next.config.ts, which a unit
// test never loads — same passthrough used in cases.test.tsx.
vi.mock("next/link", () => ({
  default: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

import { ArticleCard } from "./article-card";

const messages = { fr: frMessages, en: enMessages };

function renderCard(
  props: Partial<React.ComponentProps<typeof ArticleCard>> = {},
  locale: Locale = "fr",
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <ArticleCard
        href="/blog/le-jugement-ne-se-reproduit-pas"
        title="Le jugement ne se reproduit pas"
        date="10 juin 2026"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe("ArticleCard", () => {
  it("renders the title as a level-3 heading (the demoted index sits under the featured h2)", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: /le jugement ne se reproduit pas/i, level: 3 }),
    ).toBeInTheDocument();
  });

  it("links the title to the article via the locale-aware Link", () => {
    renderCard();

    expect(
      screen.getByRole("link", { name: /le jugement ne se reproduit pas/i }),
    ).toHaveAttribute("href", "/blog/le-jugement-ne-se-reproduit-pas");
  });

  it("renders the publish date", () => {
    renderCard();

    expect(screen.getByText("10 juin 2026")).toBeInTheDocument();
  });

  it("prefixes the link on the English route", () => {
    renderCard({}, "en");

    expect(
      screen.getByRole("link", { name: /le jugement ne se reproduit pas/i }),
    ).toHaveAttribute("href", "/en/blog/le-jugement-ne-se-reproduit-pas");
  });
});
