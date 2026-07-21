import { describe, expect, it } from "vitest";
import {
  alternateLanguages,
  alternateLanguagesAmong,
  localePath,
  localeUrl,
  openGraphLocales,
} from "./urls";

describe("localePath", () => {
  it("leaves the default locale unprefixed, so French keeps the canonical URLs", () => {
    expect(localePath("fr", "/")).toBe("/");
    expect(localePath("fr", "/approach")).toBe("/approach/");
  });

  it("prefixes the non-default locale", () => {
    expect(localePath("en", "/")).toBe("/en/");
    expect(localePath("en", "/approach")).toBe("/en/approach/");
  });

  // next.config.ts sets `trailingSlash: true`, so an advertised URL without the slash
  // would 308 on every crawl — search engines would follow a redirect to reach the
  // page we told them was canonical.
  it("ends every path with a slash, matching trailingSlash", () => {
    for (const path of ["/", "/approach", "/cases", "/culture", "/contact"]) {
      expect(localePath("fr", path).endsWith("/")).toBe(true);
      expect(localePath("en", path).endsWith("/")).toBe(true);
    }
  });
});

describe("localeUrl", () => {
  it("builds an absolute URL on the production origin", () => {
    expect(localeUrl("fr", "/cases")).toBe("https://big-emotion.com/cases/");
    expect(localeUrl("en", "/cases")).toBe("https://big-emotion.com/en/cases/");
  });
});

describe("alternateLanguages", () => {
  it("maps each locale to its own path and points x-default at French", () => {
    expect(alternateLanguages("/culture")).toEqual({
      fr: "/culture/",
      en: "/en/culture/",
      "x-default": "/culture/",
    });
  });
});

describe("alternateLanguagesAmong", () => {
  it("declares both alternates and defaults to French when an article exists in both locales", () => {
    expect(alternateLanguagesAmong("/blog/notre-approche", ["fr", "en"])).toEqual({
      fr: "/blog/notre-approche/",
      en: "/en/blog/notre-approche/",
      "x-default": "/blog/notre-approche/",
    });
  });

  it("omits the missing language when an article exists in French only", () => {
    expect(alternateLanguagesAmong("/blog/notre-approche", ["fr"])).toEqual({
      fr: "/blog/notre-approche/",
      "x-default": "/blog/notre-approche/",
    });
  });

  it("falls back x-default to the one locale that exists when French is missing", () => {
    expect(alternateLanguagesAmong("/blog/our-approach", ["en"])).toEqual({
      en: "/en/blog/our-approach/",
      "x-default": "/en/blog/our-approach/",
    });
  });

  it("returns no alternates when the document exists in no locale", () => {
    expect(alternateLanguagesAmong("/blog/ghost", [])).toEqual({});
  });
});

describe("openGraphLocales", () => {
  it("names the current locale and lists the other one as an alternate", () => {
    expect(openGraphLocales("fr")).toEqual({ locale: "fr_FR", alternateLocale: ["en_US"] });
    expect(openGraphLocales("en")).toEqual({ locale: "en_US", alternateLocale: ["fr_FR"] });
  });
});
