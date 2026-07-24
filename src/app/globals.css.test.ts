import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The palette is the one part of the brand charter a machine can check, so it is checked
// here rather than left to a reviewer's eye. `brand/BRAND.md` §1 is the transcription of
// the charter's palette page; these are the same six values, written down a second time
// on purpose. A hex edited in globals.css alone now fails the build, which is the whole
// point: colour drift is silent, and it was silent for a whole redesign.
//
// Reading the stylesheet as text rather than importing it is deliberate — Tailwind's
// `@theme` block is not a JS module, and a jsdom `getComputedStyle` would only prove the
// test environment resolved a variable, not that the committed source declares it.
const CHARTER_PALETTE = {
  lemon: "#f2ff26",
  tangerine: "#ff5200",
  lyon: "#0024cc",
  brutal: "#dbdbdb",
  ink: "#000000",
  paper: "#ffffff",
} as const;

const stylesheet = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function declaredValue(token: string): string | undefined {
  return new RegExp(`--color-${token}:\\s*([^;]+);`).exec(stylesheet)?.[1].trim().toLowerCase();
}

describe("the brand palette in globals.css", () => {
  it.each(Object.entries(CHARTER_PALETTE))(
    "declares %s at the hex the charter fixes",
    (token, hex) => {
      expect(declaredValue(token)).toBe(hex);
    },
  );

  it("adds no seventh colour the charter never sanctioned", () => {
    const declared = [...stylesheet.matchAll(/--color-([a-z-]+):/g)].map(([, token]) => token);

    expect(new Set(declared)).toEqual(new Set(Object.keys(CHARTER_PALETTE)));
  });
});
