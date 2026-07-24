import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n/locales";
import { content, site } from "./site";

// BBH Hegarty has an ASCII-only cmap: an accent in display type falls back to
// another face and renders visibly mismatched. These are the strings the
// components hand to a `font-display` element — body copy is exempt and keeps
// correct French, so this guards the slots rather than the whole module.
function displayCopy(locale: Locale) {
  const copy = content[locale];
  return [
    copy.mission,
    copy.stat.label,
    copy.scrollCue,
    ...copy.nav.map((item) => item.label),
    ...copy.sectionHeroes.flatMap((hero) => hero.title),
    ...copy.contact.title,
    ...copy.services.map((service) => service.title),
    ...copy.impactStats.map((stat) => stat.label),
    ...copy.team.flatMap((member) => [member.name, member.role]),
    ...copy.values,
    ...Object.values(copy.playground.badges).map((badge) => badge.label),
  ];
}

describe.each(locales)("%s copy", (locale) => {
  it.each(displayCopy(locale))("renders %s without accented characters", (copy) => {
    expect(copy).not.toMatch(/[À-ſ]/);
  });
});

describe("locale parity", () => {
  // Both locales are authored by hand, so the identifiers a URL or an anchor is built
  // from get asserted equal rather than assumed: a slug present in one locale only
  // would 404 the moment the switcher preserves the path across it.
  it("points the nav at the same routes in both locales", () => {
    expect(content.en.nav.map((item) => item.href)).toEqual(
      content.fr.nav.map((item) => item.href),
    );
  });

  it("keeps every outbound link identical across locales, so only the wording differs", () => {
    const hrefs = (locale: Locale) => [
      ...content[locale].team.flatMap((member) => member.links.map((link) => link.href)),
    ];
    expect(hrefs("en")).toEqual(hrefs("fr"));
  });

  it("registers the same hidden-challenge badges (by effect id) in both locales", () => {
    expect(Object.keys(content.en.playground.badges).sort()).toEqual(
      Object.keys(content.fr.playground.badges).sort(),
    );
  });
});

describe("body copy", () => {
  // The Home scroll spine's own prose (formerly `content.fr.scenes`) moved to Prismic
  // with the rest of the Home beats (SWBE-81) — see `scripts/seed-home.test.mjs` for
  // the equivalent guarantee over the seeded copy.
  it("leaves French prose correctly accented", () => {
    const founder = content.fr.team.find((member) => member.name === "Jean-Noe Kollo");
    expect(founder?.bio).toContain("démarre");
  });

  it("keeps the schema.org founder name correctly accented", () => {
    expect(site.contact.person).toBe("Jean-Noé Kollo");
  });
});
