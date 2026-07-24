import { describe, expect, it } from "vitest";
import {
  DROP_FLOOR,
  DROP_REST_HEIGHT,
  DROP_SETTLED_S,
  dropHeight,
  MAX_PITCH_RADIANS,
  MAX_YAW_RADIANS,
  pointerYawPitch,
} from "./motion";

describe("pointerYawPitch", () => {
  it("holds the mark face-on when the pointer is at the centre of the card", () => {
    const { yaw, pitch } = pointerYawPitch(0, 0);

    expect(yaw).toBeCloseTo(0);
    expect(pitch).toBeCloseTo(0);
  });

  // Horizontal pointer travel yaws, vertical pitches — and pitch is inverted so the
  // mark tips its face towards the cursor rather than away from it.
  it("turns the mark towards the pointer, to the limit at the card's edges", () => {
    expect(pointerYawPitch(1, 0).yaw).toBeCloseTo(MAX_YAW_RADIANS);
    expect(pointerYawPitch(-1, 0).yaw).toBeCloseTo(-MAX_YAW_RADIANS);
    expect(pointerYawPitch(0, 1).pitch).toBeCloseTo(-MAX_PITCH_RADIANS);
    expect(pointerYawPitch(0, -1).pitch).toBeCloseTo(MAX_PITCH_RADIANS);
  });

  // A pointer tracked past the card's own bounds must not keep winding the mark round.
  it("clamps beyond the card's bounds", () => {
    expect(pointerYawPitch(9, 9).yaw).toBeCloseTo(MAX_YAW_RADIANS);
    expect(pointerYawPitch(-9, -9).pitch).toBeCloseTo(MAX_PITCH_RADIANS);
  });
});

describe("dropHeight", () => {
  it("starts at rest height and stays there before the drop begins", () => {
    expect(dropHeight(0)).toBeCloseTo(DROP_REST_HEIGHT);
    expect(dropHeight(-1)).toBeCloseTo(DROP_REST_HEIGHT);
  });

  it("falls before it bounces", () => {
    expect(dropHeight(0.1)).toBeLessThan(DROP_REST_HEIGHT);
    expect(dropHeight(0.2)).toBeLessThan(dropHeight(0.1));
  });

  it("never sinks through the floor", () => {
    for (let t = 0; t < DROP_SETTLED_S * 2; t += 0.005) {
      expect(dropHeight(t)).toBeGreaterThanOrEqual(DROP_FLOOR - 1e-9);
    }
  });

  // The chosen behaviour is "plays once, then holds": the mark has to come to rest on
  // the floor and stay there rather than bouncing for as long as the pointer lingers.
  it("comes to rest on the floor and stays there", () => {
    expect(dropHeight(DROP_SETTLED_S)).toBeCloseTo(DROP_FLOOR, 2);
    expect(dropHeight(DROP_SETTLED_S + 30)).toBeCloseTo(DROP_FLOOR, 2);
  });

  it("bounces back up at least once instead of landing dead", () => {
    const samples = Array.from({ length: 400 }, (_, i) => dropHeight((i / 400) * DROP_SETTLED_S));
    const rebounded = samples.some((height, i) => i > 0 && height > samples[i - 1] + 1e-6);

    expect(rebounded).toBe(true);
  });
});
