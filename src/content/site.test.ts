import { describe, expect, it } from "vitest";
import { STATES } from "@/components/scene/states";
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
    ...copy.scenes.flatMap((scene) => scene.title),
    ...copy.contact.title,
    ...copy.services.map((service) => service.title),
    ...copy.impactStats.map((stat) => stat.label),
    ...copy.cases.flatMap((sector) => [sector.title, sector.kind]),
    ...copy.productions.flatMap((production) => [production.title, production.kind]),
    ...copy.team.flatMap((member) => [member.name, member.role]),
    ...copy.values,
  ];
}

describe.each(locales)("%s copy", (locale) => {
  it.each(displayCopy(locale))("renders %s without accented characters", (copy) => {
    expect(copy).not.toMatch(/[À-ſ]/);
  });

  it("names the six scenes in the order the scroll choreography plays them", () => {
    expect(content[locale].scenes.map((scene) => scene.id)).toEqual(
      STATES.map((state) => state.name),
    );
  });
});

describe("locale parity", () => {
  // Both locales are authored by hand, so the identifiers a URL or an anchor is built
  // from get asserted equal rather than assumed: a slug present in one locale only
  // would 404 the moment the switcher preserves the path across it.
  it("exposes the same sector case slugs in both locales", () => {
    expect(content.en.cases.map((sector) => sector.slug)).toEqual(
      content.fr.cases.map((sector) => sector.slug),
    );
  });

  it("exposes the same production slugs in both locales", () => {
    expect(content.en.productions.map((production) => production.slug)).toEqual(
      content.fr.productions.map((production) => production.slug),
    );
  });

  it("points the nav at the same routes in both locales", () => {
    expect(content.en.nav.map((item) => item.href)).toEqual(
      content.fr.nav.map((item) => item.href),
    );
  });

  it("keeps every outbound link identical across locales, so only the wording differs", () => {
    const hrefs = (locale: Locale) => [
      ...content[locale].productions.flatMap((p) => p.links.map((link) => link.href)),
      ...content[locale].team.flatMap((member) => member.links.map((link) => link.href)),
    ];
    expect(hrefs("en")).toEqual(hrefs("fr"));
  });
});

describe("body copy", () => {
  it("leaves French prose correctly accented", () => {
    const intro = content.fr.scenes.find((scene) => scene.id === "intro");
    expect(intro?.body).toContain("créatif");
  });

  it("keeps the schema.org founder name correctly accented", () => {
    expect(site.contact.person).toBe("Jean-Noé Kollo");
  });
});
