import { describe, expect, it } from "vitest";
import { CAMERA } from "@/components/scene/states";
import {
  clampDolly,
  DOLLY_DEFAULT,
  DOLLY_MAX,
  DOLLY_MIN,
  WORDMARK_HEIGHT,
  WORDMARK_RADIUS,
} from "./zoom-clamp";

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

describe("the closest dolly a visitor can reach", () => {
  // three.js fixes the vertical FOV and derives the horizontal one from the aspect
  // ratio, so framing measured on the vertical axis holds for every viewport shape —
  // a narrow phone only ever sees the wordmark larger than this, never smaller.
  const visibleHeightAtClosestDolly = 2 * DOLLY_MIN * Math.tan((CAMERA.fov * Math.PI) / 360);

  it("fills most of the frame, so the glint detail can actually be inspected", () => {
    expect(WORDMARK_HEIGHT / visibleHeightAtClosestDolly).toBeGreaterThan(0.7);
  });

  it("stops before the near plane can slice into the wordmark, whatever the drag angle", () => {
    expect(DOLLY_MIN - WORDMARK_RADIUS).toBeGreaterThan(CAMERA.near);
  });
});
