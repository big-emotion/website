import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/locales";
import { playgroundEffects } from "./effects";

describe("playgroundEffects", () => {
  it("registers LUMIERE (SWBE-215) as the first effect", () => {
    expect(playgroundEffects.map((effect) => effect.id)).toEqual(["lumiere"]);
  });

  it("keeps every effect's title ASCII-only, since it lands in a font-display slot (DEC-023)", () => {
    for (const effect of playgroundEffects) {
      for (const locale of locales) {
        expect(effect.title[locale]).toMatch(/^[\x00-\x7F]*$/);
      }
    }
  });

  it("gives every effect a slug, and title/description in every supported locale", () => {
    for (const effect of playgroundEffects) {
      expect(effect.slug).toBeTruthy();
      for (const locale of locales) {
        expect(effect.title[locale]).toBeTruthy();
        expect(effect.description[locale]).toBeTruthy();
      }
    }
  });
});
