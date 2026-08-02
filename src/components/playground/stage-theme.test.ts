import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  allowedLogoColors,
  DEFAULT_STAGE_THEME,
  STAGE_COLOR_HEX,
  STAGE_COLORS,
  stageBallColor,
  stageColorToken,
  withBackdrop,
} from "./stage-theme";

// Same rationale as globals.css.test.ts: the hexes exist twice on purpose (Three.js
// cannot read a CSS variable), so a machine checks they never diverge.
const stylesheet = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("STAGE_COLOR_HEX", () => {
  // @req REQ-002
  it.each(STAGE_COLORS)("matches the %s hex globals.css declares", (color) => {
    const declared = new RegExp(`--color-${color}:\\s*([^;]+);`)
      .exec(stylesheet)?.[1]
      .trim()
      .toLowerCase();
    expect(STAGE_COLOR_HEX[color]).toBe(declared);
  });
});

describe("allowedLogoColors", () => {
  // @req REQ-037
  it.each(STAGE_COLORS)("always offers chrome (paper) on a %s backdrop", (backdrop) => {
    expect(allowedLogoColors(backdrop)).toContain("paper");
  });

  // @req REQ-037
  it.each(STAGE_COLORS)(
    "never offers the %s backdrop its own colour as a flat logo",
    (backdrop) => {
      const flatOptions = allowedLogoColors(backdrop).filter((color) => color !== "paper");
      expect(flatOptions).not.toContain(backdrop);
    },
  );

  // @req REQ-037
  it("keeps the shipped default legal", () => {
    expect(allowedLogoColors(DEFAULT_STAGE_THEME.backdrop)).toContain(DEFAULT_STAGE_THEME.logo);
  });
});

describe("withBackdrop", () => {
  // @req REQ-037
  it("keeps a logo colour the new backdrop still allows", () => {
    const theme = withBackdrop({ backdrop: "brutal", logo: "tangerine" }, "paper");
    expect(theme).toEqual({ backdrop: "paper", logo: "tangerine" });
  });

  // @req REQ-037
  it("snaps an off-matrix logo colour to the new backdrop's first allowed one", () => {
    // Ink logo is not paired with an ink backdrop.
    const theme = withBackdrop({ backdrop: "lemon", logo: "ink" }, "ink");
    expect(theme.backdrop).toBe("ink");
    expect(allowedLogoColors("ink")).toContain(theme.logo);
    expect(theme.logo).not.toBe("ink");
  });
});

describe("stageBallColor", () => {
  // @req REQ-037
  it.each(STAGE_COLORS)("never blends the ball into a %s backdrop", (backdrop) => {
    const theme = withBackdrop(DEFAULT_STAGE_THEME, backdrop);
    expect(stageBallColor(theme)).not.toBe(backdrop);
  });

  // @req REQ-037
  it("never paints the ball the logo's own colour", () => {
    for (const backdrop of STAGE_COLORS) {
      for (const logo of allowedLogoColors(backdrop)) {
        expect(stageBallColor({ backdrop, logo })).not.toBe(logo);
      }
    }
  });
});

describe("stageColorToken", () => {
  // @req REQ-037
  it("hands DOM consumers the CSS variable, never a hex", () => {
    expect(stageColorToken("lemon")).toBe("var(--color-lemon)");
  });
});
