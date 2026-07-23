import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/locales";
import { playgroundEffects } from "./effects";

describe("playgroundEffects", () => {
  it("registers BIG BANG (SWBE-214), the first effect past the empty v1 shell (DEC-030)", () => {
    expect(playgroundEffects.map((effect) => effect.id)).toEqual(["big-bang"]);
  });

  it("gives every effect a lazy component, never an eagerly-imported one", () => {
    for (const effect of playgroundEffects) {
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
