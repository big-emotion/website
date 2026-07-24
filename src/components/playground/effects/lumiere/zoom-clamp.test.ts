import { describe, expect, it } from "vitest";
import { ZOOM_RATIO } from "@/components/playground/camera-framing";
import { CAMERA } from "@/components/scene/states";
import {
  clampDolly,
  dollyFraming,
  DOLLY_BODY_FLOOR,
  DOLLY_DEFAULT,
  DOLLY_MAX,
  DOLLY_MIN,
  stepDolly,
  WORDMARK_HEIGHT,
  WORDMARK_RADIUS,
} from "./zoom-clamp";

// three.js fixes the vertical FOV and derives the horizontal one from the aspect ratio,
// so framing measured on the vertical axis holds for every viewport shape — a narrow
// phone only ever sees the wordmark larger than this, never smaller.
function visibleHeight(framing: number): number {
  const { distance, fov } = dollyFraming(framing);
  return 2 * distance * Math.tan((fov * Math.PI) / 360);
}

describe("clampDolly", () => {
  it("passes a framing within bounds through unchanged", () => {
    expect(clampDolly(DOLLY_DEFAULT)).toBe(DOLLY_DEFAULT);
  });

  it("clamps a framing below the minimum up to the minimum", () => {
    expect(clampDolly(DOLLY_MIN - 1)).toBe(DOLLY_MIN);
  });

  it("clamps a framing above the maximum down to the maximum", () => {
    expect(clampDolly(DOLLY_MAX + 1)).toBe(DOLLY_MAX);
  });

  it("treats the bounds themselves as valid, unclamped values", () => {
    expect(clampDolly(DOLLY_MIN)).toBe(DOLLY_MIN);
    expect(clampDolly(DOLLY_MAX)).toBe(DOLLY_MAX);
  });
});

describe("stepDolly", () => {
  it("brings the framing closer on the way in, further on the way out", () => {
    expect(stepDolly(DOLLY_DEFAULT, "in")).toBeLessThan(DOLLY_DEFAULT);
    expect(stepDolly(DOLLY_DEFAULT, "out")).toBeGreaterThan(DOLLY_DEFAULT);
  });

  it("honours the same bounds the wheel does, so a held key cannot escape the frame", () => {
    expect(stepDolly(DOLLY_MIN, "in")).toBe(DOLLY_MIN);
    expect(stepDolly(DOLLY_MAX, "out")).toBe(DOLLY_MAX);
  });

  // A control that needs twenty presses to reach the detail reads as broken, so the step
  // is sized against the whole travel rather than picked in the abstract.
  it("crosses the full range in a handful of presses", () => {
    expect(Math.ceil(Math.log(DOLLY_MAX / DOLLY_MIN) / Math.log(ZOOM_RATIO))).toBeLessThanOrEqual(
      10,
    );
  });
});

describe("the closest framing a visitor can reach", () => {
  it("magnifies three times past the last position the camera itself can travel to", () => {
    expect(visibleHeight(DOLLY_BODY_FLOOR) / visibleHeight(DOLLY_MIN)).toBeCloseTo(3, 6);
  });

  it("overflows the frame with the wordmark, so the glint detail fills it", () => {
    expect(WORDMARK_HEIGHT / visibleHeight(DOLLY_MIN)).toBeGreaterThan(2);
  });

  it("leaves the whole mark in frame at the widest end", () => {
    expect(WORDMARK_HEIGHT / visibleHeight(DOLLY_MAX)).toBeLessThan(0.5);
  });

  it("keeps the near plane clear of the wordmark, whatever the drag angle", () => {
    // The lens, not the dolly, is what carries the last three presses — so the camera
    // body never gets closer than this however hard a visitor leans on the button.
    expect(dollyFraming(DOLLY_MIN).distance - WORDMARK_RADIUS).toBeGreaterThan(CAMERA.near);
  });

  it("hands the framing at the body floor to the camera itself, lens still at the rig's", () => {
    expect(dollyFraming(DOLLY_BODY_FLOOR)).toEqual({
      distance: DOLLY_BODY_FLOOR,
      fov: CAMERA.fov,
    });
  });
});
