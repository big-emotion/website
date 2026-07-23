import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/locales";
import { playgroundEffects } from "./effects";

const ASCII_ONLY = /^[\x00-\x7F]*$/;

describe("playgroundEffects", () => {
  it("registers LUMIERE (SWBE-215), poids-lourd (SWBE-213) and BIG BANG (SWBE-214)", () => {
    expect(playgroundEffects.map((effect) => effect.id)).toEqual([
      "lumiere",
      "poids-lourd",
      "big-bang",
    ]);
  });

  it("registers poids-lourd (SWBE-213)", () => {
    const effect = playgroundEffects.find((e) => e.id === "poids-lourd");
    expect(effect).toBeDefined();
    expect(effect!.slug).toBe("poids-lourd");
    expect(effect!.title).toEqual({ fr: "Poids Lourd", en: "Heavyweight" });
    expect(effect!.description.fr).toContain("chromé");
    expect(effect!.description.en).toContain("chrome");
  });

  it("keeps every registered title ASCII-only, per DEC-023's font-display constraint", () => {
    for (const effect of playgroundEffects) {
      for (const locale of locales) {
        expect(effect.title[locale]).toMatch(ASCII_ONLY);
      }
    }
  });

  it("gives every effect a slug, and a lazy component, never an eagerly-imported one", () => {
    for (const effect of playgroundEffects) {
      expect(effect.slug).toBeTruthy();
      expect(effect.component.$$typeof).toBe(Symbol.for("react.lazy"));
    }
  });

  it.each(locales)("carries a title and description for %s", (locale) => {
    for (const effect of playgroundEffects) {
      expect(effect.title[locale]).toBeTruthy();
      expect(effect.description[locale]).toBeTruthy();
    }
  });

  // BBH Hegarty has an ASCII-only cmap (DEC-023): `title` lands in a `font-display`
  // slot (the page's h1 and the OG card), so it must stay unaccented in both locales —
  // same rule site.test.ts enforces for site.ts's own display-slot copy.
  it.each(locales)("keeps %s titles unaccented for the font-display slot", (locale) => {
    for (const effect of playgroundEffects) {
      expect(effect.title[locale]).not.toMatch(/[À-ſ]/);
    }
  });
});
