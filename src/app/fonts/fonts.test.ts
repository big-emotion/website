import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// DEC-023: BBH replaces the Archivo stand-in as the display face. Guards the properties
// the rest of the app depends on: next/font/local needs a real WOFF2, and the OG image
// (satori) needs a WOFF1 build next to it since satori can't parse WOFF2 — see
// src/app/opengraph-image.tsx.
describe("display font files", () => {
  const fontsDir = join(process.cwd(), "src/app/fonts");

  // The charter's signature is one headline mixing the three widths (brand/BRAND.md §2),
  // which needs all three cuts on disk — for a year only Hegarty was, so no headline
  // could do it.
  it.each(["bbh-bogle-latin", "bbh-hegarty-latin", "bbh-bartle-latin"])(
    "ships %s as a WOFF2 for next/font/local",
    (cut) => {
      const file = readFileSync(join(fontsDir, `${cut}.woff2`));
      expect(file.subarray(0, 4).toString("latin1")).toBe("wOF2");
    },
  );

  it("ships a satori-compatible WOFF1 build for the OG image", () => {
    const file = readFileSync(join(fontsDir, "bbh-hegarty-latin.woff"));
    expect(file.subarray(0, 4).toString("latin1")).toBe("wOFF");
  });

  it("no longer ships the retired Archivo stand-in", () => {
    expect(existsSync(join(fontsDir, "archivo-latin.woff2"))).toBe(false);
  });
});
