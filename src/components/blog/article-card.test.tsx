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

function renderCard(props: Partial<React.ComponentProps<typeof ArticleCard>> = {}, locale: Locale = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <ArticleCard
        href="/blog/le-brief-qui-change-tout"
        title="Le brief qui change tout"
        kind="Strategie de marque"
        excerpt="Ce qu'on a fait et ce que ca a change."
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe("ArticleCard", () => {
  it("renders the title, kind and excerpt", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: /le brief qui change tout/i })).toBeInTheDocument();
    expect(screen.getByText("Strategie de marque")).toBeInTheDocument();
    expect(screen.getByText(/ce qu'on a fait/i)).toBeInTheDocument();
  });

  it("links the title to the article via the locale-aware Link", () => {
    renderCard();

    expect(screen.getByRole("link", { name: /le brief qui change tout/i })).toHaveAttribute(
      "href",
      "/blog/le-brief-qui-change-tout",
    );
  });

  it("renders the cover through next/image when provided", () => {
    renderCard({ cover: { src: "/cover.jpg", alt: "Une legende", width: 800, height: 500 } });

    const image = screen.getByRole("img", { name: "Une legende" });
    expect(image).toHaveAttribute("width", "800");
    expect(image).toHaveAttribute("height", "500");
  });

  it("falls back to a decorative placeholder when no cover is provided", () => {
    const { container } = renderCard();

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("prefixes the link on the English route", () => {
    renderCard({}, "en");

    expect(screen.getByRole("link", { name: /le brief qui change tout/i })).toHaveAttribute(
      "href",
      "/en/blog/le-brief-qui-change-tout",
    );
  });
});
