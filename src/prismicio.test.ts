import type { PrismicDocument } from "@prismicio/client";
import { describe, expect, it } from "vitest";
import { linkResolver, prismicLocale, routeLocale } from "./prismicio";

function document(fields: Partial<PrismicDocument>): PrismicDocument {
  return { type: "case_study", uid: "industrie", lang: "fr-fr", ...fields } as PrismicDocument;
}

describe("locale mapping", () => {
  it("maps each route locale to its Prismic counterpart and back", () => {
    expect(prismicLocale("fr")).toBe("fr-fr");
    expect(prismicLocale("en")).toBe("en-us");
    expect(routeLocale("fr-fr")).toBe("fr");
    expect(routeLocale("en-us")).toBe("en");
  });

  it("does not recognise a locale the repository does not publish", () => {
    expect(routeLocale("de-de")).toBeUndefined();
  });
});

describe("linkResolver", () => {
  // French is served unprefixed and English under /en (localePrefix "as-needed"), and
  // next.config.ts sets trailingSlash — the toolbar must land on the canonical form or
  // the editor eats a redirect on every preview.
  it("sends a French case study to its unprefixed, slashed URL", () => {
    expect(linkResolver(document({}))).toBe("/cases/industrie/");
  });

  it("prefixes an English case study with its locale segment", () => {
    expect(linkResolver(document({ lang: "en-us", uid: "medias" }))).toBe("/en/cases/medias/");
  });

  // Returning null lets redirectToPreviewURL fall back to its default URL. Guessing a
  // path instead would drop the editor on a 404.
  it("declines to place a document type it knows nothing about", () => {
    expect(linkResolver(document({ type: "landing_page" }))).toBeNull();
  });

  it("declines to place a document in an unpublished locale", () => {
    expect(linkResolver(document({ lang: "de-de" }))).toBeNull();
  });

  it("declines to place a document that has no uid", () => {
    expect(linkResolver(document({ uid: null }))).toBeNull();
  });

  it("sends a French article to its unprefixed /blog URL", () => {
    expect(linkResolver(document({ type: "article", uid: "notre-approche" }))).toBe(
      "/blog/notre-approche/",
    );
  });

  it("prefixes an English article with its locale segment", () => {
    expect(
      linkResolver(document({ type: "article", lang: "en-us", uid: "our-approach" })),
    ).toBe("/en/blog/our-approach/");
  });
});
