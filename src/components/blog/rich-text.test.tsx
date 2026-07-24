import type { RichTextField } from "@prismicio/client";
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

import { ArticleRichText } from "./rich-text";

const messages = { fr: frMessages, en: enMessages };

function renderField(field: RichTextField, locale: Locale = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <ArticleRichText field={field} />
    </NextIntlClientProvider>,
  );
}

/** A `case_study` Document link in the given Prismic locale, as Prismic's link picker stores it. */
function internalLinkField(lang: string) {
  return [
    {
      type: "paragraph",
      text: "Voir aussi notre etude de cas.",
      spans: [
        {
          type: "hyperlink",
          start: 17,
          end: 29,
          data: {
            link_type: "Document",
            id: "case-study-id",
            type: "case_study",
            uid: "industrie",
            lang,
            tags: [],
          },
        },
      ],
    },
  ] as unknown as RichTextField;
}

const MIXED_FIELD = [
  { type: "heading2", text: "Un titre de section", spans: [] },
  { type: "paragraph", text: "Un paragraphe de corps.", spans: [] },
  { type: "list-item", text: "Premier point", spans: [] },
  { type: "list-item", text: "Second point", spans: [] },
  {
    type: "paragraph",
    text: "Un lien externe.",
    spans: [
      {
        type: "hyperlink",
        start: 3,
        end: 7,
        data: { link_type: "Web", url: "https://example.com" },
      },
    ],
  },
  {
    type: "image",
    id: "img1",
    url: "https://images.prismic.io/big-emotion/photo.jpg",
    alt: "Une legende",
    copyright: null,
    dimensions: { width: 1200, height: 800 },
    edit: { x: 0, y: 0, zoom: 1, background: "" },
  },
] as unknown as RichTextField;

describe("ArticleRichText", () => {
  it("renders headings, paragraphs and lists as branded semantic elements", () => {
    renderField(MIXED_FIELD);

    expect(
      screen.getByRole("heading", { level: 2, name: "Un titre de section" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Un paragraphe de corps.")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders images through next/image with the field's own dimensions and alt text", () => {
    renderField(MIXED_FIELD);

    const image = screen.getByRole("img", { name: "Une legende" });
    expect(image).toHaveAttribute("width", "1200");
    expect(image).toHaveAttribute("height", "800");
  });

  it("opens external hyperlinks in a new tab with a safe rel", () => {
    renderField(MIXED_FIELD);

    expect(screen.getByRole("link", { name: "lien" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByRole("link", { name: "lien" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "lien" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("routes a same-locale internal hyperlink through the locale-aware Link without a doubled prefix", () => {
    renderField(internalLinkField("en-us"), "en");

    expect(screen.getByRole("link", { name: "etude de cas" })).toHaveAttribute(
      "href",
      "/en/cases/industrie/",
    );
  });

  it("keeps the French route unprefixed for the same internal link", () => {
    renderField(internalLinkField("fr-fr"), "fr");

    expect(screen.getByRole("link", { name: "etude de cas" })).toHaveAttribute(
      "href",
      "/cases/industrie/",
    );
  });
});
