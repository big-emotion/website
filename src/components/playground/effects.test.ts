import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/locales";
import { playgroundEffects } from "./effects";

const ASCII_ONLY = /^[\x00-\x7F]*$/;

describe("playgroundEffects", () => {
  it("registers poids-lourd (SWBE-213)", () => {
    expect(playgroundEffects).toHaveLength(1);
    const [effect] = playgroundEffects;
    expect(effect.id).toBe("poids-lourd");
    expect(effect.slug).toBe("poids-lourd");
    expect(effect.title).toEqual({ fr: "Poids Lourd", en: "Heavyweight" });
    expect(effect.description.fr).toContain("chromé");
    expect(effect.description.en).toContain("chrome");
  });

  it("keeps every registered title ASCII-only, per DEC-023's font-display constraint", () => {
    for (const effect of playgroundEffects) {
      for (const locale of locales) {
        expect(effect.title[locale]).toMatch(ASCII_ONLY);
      }
    }
  });
});
