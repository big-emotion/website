import { describe, expect, it } from "vitest";
import { computeFit, STATES, TAU } from "./states";

const BRAND_TOKENS = ["lemon", "tangerine", "lyon", "ink", "paper"];

describe("STATES", () => {
  it("has exactly six ordered keyframes", () => {
    expect(STATES).toHaveLength(6);
    expect(STATES.map((s) => s.name)).toEqual([
      "intro",
      "approach",
      "cases",
      "culture",
      "louder",
      "final",
    ]);
  });

  it("grows scale monotonically until the final shrink", () => {
    const scales = STATES.map((s) => s.scale);
    for (let i = 1; i < scales.length - 1; i++) {
      expect(scales[i]).toBeGreaterThan(scales[i - 1]);
    }
    expect(scales.at(-1)).toBeLessThan(scales.at(-2)!);
  });

  it("only ever references brand tokens, never a raw hex value", () => {
    for (const state of STATES) {
      expect(BRAND_TOKENS).toContain(state.stage);
      expect(BRAND_TOKENS).toContain(state.ink);
    }
  });

  it("docks the final state face-on and above the closing text", () => {
    const final = STATES.at(-1)!;
    expect(final.name).toBe("final");
    expect(final.rx).toBe(0);
    expect(final.rz).toBe(0);
    expect(final.ry).toBe(-TAU);
    expect(final.y).toBeGreaterThan(0);
  });
});

describe("computeFit", () => {
  it("stays at full scale for landscape/desktop aspect ratios", () => {
    expect(computeFit(16 / 9)).toBe(1);
    expect(computeFit(1)).toBe(1);
  });

  it("shrinks proportionally for portrait aspect ratios, clamped at 0.45", () => {
    expect(computeFit(9 / 16)).toBeCloseTo((9 / 16) * 0.9, 5);
    expect(computeFit(0.1)).toBe(0.45);
  });
});
