// @req REQ-002

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The palette is the one part of the brand system a machine can check, so it is checked
// here rather than left to a reviewer's eye. `brand/BRAND.md` transcribes the charter and
// records the designer-approved site override for lemon; these are the six values the
// site must actually ship, written down a second time on purpose. A hex edited in
// globals.css alone now fails the build, which is the whole point: colour drift is silent.
//
// Reading the stylesheet as text rather than importing it is deliberate — Tailwind's
// `@theme` block is not a JS module, and a jsdom `getComputedStyle` would only prove the
// test environment resolved a variable, not that the committed source declares it.
const SITE_PALETTE = {
  lemon: "#e9fc55",
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
  it.each(Object.entries(SITE_PALETTE))("declares %s at the approved site hex", (token, hex) => {
    expect(declaredValue(token)).toBe(hex);
  });

  it("adds no seventh colour the charter never sanctioned", () => {
    const declared = [...stylesheet.matchAll(/--color-([a-z-]+):/g)].map(([, token]) => token);

    expect(new Set(declared)).toEqual(new Set(Object.keys(SITE_PALETTE)));
  });

  it("ships no legacy lemon value in visitor-facing source or public assets", () => {
    const sourceFiles = ["src", "public"].flatMap((root) => filesBelow(root));
    const offenders = sourceFiles.filter(
      (file) =>
        !file.includes(".test.") &&
        /\.(css|json|svg|ts|tsx)$/.test(file) &&
        readFileSync(file, "utf8").toLowerCase().includes("#f2ff26"),
    );

    expect(offenders).toEqual([]);
  });
});

function filesBelow(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? filesBelow(child) : child;
  });
}
