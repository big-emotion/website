import { describe, expect, it } from "vitest";
import { clampDolly, DOLLY_DEFAULT, DOLLY_MAX, DOLLY_MIN } from "./zoom-clamp";

describe("clampDolly", () => {
  it("passes a distance within bounds through unchanged", () => {
    expect(clampDolly(DOLLY_DEFAULT)).toBe(DOLLY_DEFAULT);
  });

  it("clamps a distance below the minimum up to the minimum", () => {
    expect(clampDolly(DOLLY_MIN - 1)).toBe(DOLLY_MIN);
  });

  it("clamps a distance above the maximum down to the maximum", () => {
    expect(clampDolly(DOLLY_MAX + 1)).toBe(DOLLY_MAX);
  });

  it("treats the bounds themselves as valid, unclamped values", () => {
    expect(clampDolly(DOLLY_MIN)).toBe(DOLLY_MIN);
    expect(clampDolly(DOLLY_MAX)).toBe(DOLLY_MAX);
  });
});
