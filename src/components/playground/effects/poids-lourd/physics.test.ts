import { describe, expect, it } from "vitest";
import { ZOOM_RATIO } from "@/components/playground/camera-framing";
import {
  BODY_RADIUS,
  CAMERA_BODY_FLOOR,
  CAMERA_DISTANCE_DEFAULT,
  CAMERA_DISTANCE_MAX,
  CAMERA_DISTANCE_MIN,
  cameraFraming,
  clampCameraDistance,
  stepCameraDistance,
  frameDelta,
  SLOW_MOTION_SCALE,
  isAtRest,
  isThrow,
  reflectOffWalls,
  sampleVelocity,
  stepMotion,
  stepTorque,
  visibleHalfHeight,
  wallHalfExtent,
} from "./physics";

describe("stepMotion", () => {
  it("integrates gravity into velocity, then velocity into position (semi-implicit Euler)", () => {
    const result = stepMotion({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 10 }, 1);
    // v' = v + a*dt = (0, 10); p' = p + v'*dt = (0, 10)
    expect(result.velocity).toEqual({ x: 0, y: 10 });
    expect(result.position).toEqual({ x: 0, y: 10 });
  });

  it("carries existing velocity forward with no acceleration", () => {
    const result = stepMotion({ x: 5, y: 5 }, { x: 2, y: -3 }, { x: 0, y: 0 }, 0.5);
    expect(result.velocity).toEqual({ x: 2, y: -3 });
    expect(result.position).toEqual({ x: 6, y: 3.5 });
  });
});

describe("reflectOffWalls", () => {
  const bounds = { minX: -10, maxX: 10, minY: -10, maxY: 10 };

  it("leaves an in-bounds position untouched", () => {
    const result = reflectOffWalls({ x: 0, y: 0 }, { x: 3, y: -2 }, bounds, 1, 1);
    expect(result).toEqual({ position: { x: 0, y: 0 }, velocity: { x: 3, y: -2 }, bounced: false });
  });

  it("mirrors an overshoot past the right wall (minus radius) and reverses x velocity", () => {
    const result = reflectOffWalls({ x: 11, y: 0 }, { x: 4, y: 0 }, bounds, 1, 1);
    // effective edge = maxX - radius = 9; overshoot = 11 - 9 = 2; mirrored = 9 - 2 = 7
    expect(result.position.x).toBe(7);
    expect(result.velocity.x).toBe(-4);
    expect(result.bounced).toBe(true);
  });

  it("mirrors an overshoot past the left wall (plus radius) and reverses x velocity", () => {
    const result = reflectOffWalls({ x: -11, y: 0 }, { x: -4, y: 0 }, bounds, 1, 1);
    expect(result.position.x).toBe(-7);
    expect(result.velocity.x).toBe(4);
    expect(result.bounced).toBe(true);
  });

  it("mirrors an overshoot past the bottom wall (minus radius) and reverses y velocity", () => {
    const result = reflectOffWalls({ x: 0, y: 12 }, { x: 0, y: 5 }, bounds, 1, 1);
    expect(result.position.y).toBe(6);
    expect(result.velocity.y).toBe(-5);
    expect(result.bounced).toBe(true);
  });

  it("mirrors an overshoot past the top wall (plus radius) and reverses y velocity", () => {
    const result = reflectOffWalls({ x: 0, y: -12 }, { x: 0, y: -5 }, bounds, 1, 1);
    expect(result.position.y).toBe(-6);
    expect(result.velocity.y).toBe(5);
    expect(result.bounced).toBe(true);
  });

  it("accounts for the object radius when detecting the wall", () => {
    const result = reflectOffWalls({ x: 9.5, y: 0 }, { x: 4, y: 0 }, bounds, 1, 1);
    expect(result.bounced).toBe(true);
  });

  it("scales the reflected velocity by the restitution coefficient", () => {
    const result = reflectOffWalls({ x: 11, y: 0 }, { x: 4, y: 0 }, bounds, 1, 0.5);
    expect(result.velocity.x).toBe(-2);
  });

  it("bounces both axes in the same step when the corner is overshot", () => {
    const result = reflectOffWalls({ x: 11, y: 11 }, { x: 4, y: 6 }, bounds, 1, 1);
    expect(result.velocity).toEqual({ x: -4, y: -6 });
    expect(result.bounced).toBe(true);
  });
});

describe("sampleVelocity", () => {
  it("returns zero velocity with fewer than two samples", () => {
    expect(sampleVelocity([])).toEqual({ x: 0, y: 0 });
    expect(sampleVelocity([{ x: 1, y: 1, t: 0 }])).toEqual({ x: 0, y: 0 });
  });

  it("derives velocity from the oldest and newest sample in the window", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 10, y: 0, t: 100 },
      { x: 20, y: -10, t: 200 },
    ];
    // (20-0)/((200-0)/1000) = 100 px/s on x; (-10-0)/0.2 = -50 px/s on y
    expect(sampleVelocity(samples)).toEqual({ x: 100, y: -50 });
  });

  it("ignores samples older than the sampling window", () => {
    const samples = [
      { x: 0, y: 0, t: 0 },
      { x: 500, y: 0, t: 50 }, // outside the 100ms window, should be dropped
      { x: 10, y: 0, t: 150 },
      { x: 20, y: 0, t: 200 },
    ];
    const result = sampleVelocity(samples, 100);
    // Only the last two samples (150ms apart from 200 -> window boundary) survive:
    // oldest kept is t=150 (200-150=50ms <= 100ms window), newest is t=200.
    expect(result).toEqual({ x: (20 - 10) / 0.05, y: 0 });
  });

  it("returns zero when the surviving samples share the same timestamp", () => {
    const samples = [
      { x: 0, y: 0, t: 100 },
      { x: 5, y: 5, t: 100 },
    ];
    expect(sampleVelocity(samples)).toEqual({ x: 0, y: 0 });
  });
});

describe("isAtRest", () => {
  it("is at rest once speed drops to or below the threshold", () => {
    expect(isAtRest({ x: 0.05, y: 0 }, 0.1)).toBe(true);
    expect(isAtRest({ x: 0.1, y: 0 }, 0.1)).toBe(true);
  });

  it("is not at rest above the threshold", () => {
    expect(isAtRest({ x: 0.2, y: 0 }, 0.1)).toBe(false);
  });
});

describe("isThrow", () => {
  it("counts as a throw once speed reaches the gesture threshold", () => {
    expect(isThrow({ x: 300, y: 0 }, 250)).toBe(true);
    expect(isThrow({ x: 250, y: 0 }, 250)).toBe(true);
  });

  it("is not a throw below the threshold", () => {
    expect(isThrow({ x: 100, y: 100 }, 250)).toBe(false);
  });
});

describe("stepTorque", () => {
  it("advances angular position by angular velocity and damps the velocity", () => {
    const result = stepTorque(0, 2, 0.5, 1);
    expect(result.angle).toBe(2);
    expect(result.angularVelocity).toBe(1);
  });

  it("decays toward rest as damping approaches 1", () => {
    const result = stepTorque(0, 2, 0.9, 1);
    expect(result.angularVelocity).toBeCloseTo(0.2);
  });
});

// The two mouse-only camera gestures (wheel dolly, held secondary button for slow
// motion). Both are pure arithmetic, so they are proved here rather than through a
// renderer.
describe("clampCameraDistance", () => {
  it("keeps the default framing untouched", () => {
    expect(clampCameraDistance(CAMERA_DISTANCE_DEFAULT)).toBe(CAMERA_DISTANCE_DEFAULT);
  });

  it("stops the visitor closing in past the tightest framing", () => {
    expect(clampCameraDistance(0.05)).toBe(CAMERA_DISTANCE_MIN);
    expect(clampCameraDistance(-40)).toBe(CAMERA_DISTANCE_MIN);
  });

  it("stops the logo receding out of reach", () => {
    expect(clampCameraDistance(999)).toBe(CAMERA_DISTANCE_MAX);
  });

  it("frames the logo larger than the range it shipped with", () => {
    // It shipped at distance 4 with a 50° field of view; the rig it now shares with the
    // home hero is 42° at 3 (PG-26), and half of the visible height is what decides how
    // much of the frame the unit-scaled logo fills.
    const asShipped = 4 * Math.tan((50 * Math.PI) / 360);

    expect(visibleHalfHeight(CAMERA_DISTANCE_DEFAULT)).toBeLessThan(asShipped);
  });
});

describe("stepCameraDistance", () => {
  it("brings the camera closer on the way in, further on the way out", () => {
    expect(stepCameraDistance(CAMERA_DISTANCE_DEFAULT, "in")).toBeLessThan(CAMERA_DISTANCE_DEFAULT);
    expect(stepCameraDistance(CAMERA_DISTANCE_DEFAULT, "out")).toBeGreaterThan(
      CAMERA_DISTANCE_DEFAULT,
    );
  });

  it("honours the same bounds the wheel does", () => {
    expect(stepCameraDistance(CAMERA_DISTANCE_MIN, "in")).toBe(CAMERA_DISTANCE_MIN);
    expect(stepCameraDistance(CAMERA_DISTANCE_MAX, "out")).toBe(CAMERA_DISTANCE_MAX);
  });

  // A control that needs twenty presses to reach the detail reads as broken, so the step
  // is sized against the whole travel rather than picked in the abstract.
  it("crosses the full range in a handful of presses", () => {
    expect(
      Math.ceil(Math.log(CAMERA_DISTANCE_MAX / CAMERA_DISTANCE_MIN) / Math.log(ZOOM_RATIO)),
    ).toBeLessThanOrEqual(10);
  });
});

describe("the closest framing a visitor can reach", () => {
  it("magnifies three times past the last position the camera itself can travel to", () => {
    expect(CAMERA_BODY_FLOOR / CAMERA_DISTANCE_MIN).toBeCloseTo(3, 6);
  });

  it("holds the camera on its floor rather than reversing into the toy", () => {
    expect(cameraFraming(CAMERA_DISTANCE_MIN).distance).toBe(CAMERA_BODY_FLOOR);
  });
});

// The walls are the frame's own edges, which is what makes the toy feel like it lives
// in the viewport — but only while the frame is bigger than the toy.
describe("wallHalfExtent", () => {
  it("tracks the frame at every framing the toy still fits inside", () => {
    expect(wallHalfExtent(visibleHalfHeight(CAMERA_DISTANCE_DEFAULT))).toBeCloseTo(
      visibleHalfHeight(CAMERA_DISTANCE_DEFAULT),
      6,
    );
  });

  it("stops following the frame before the walls can close inside the toy", () => {
    // Zoomed all the way in the frame is narrower than the body itself. Walls that kept
    // tracking it would inset past each other, and `reflectOffWalls` would mirror the
    // body between two crossed edges forever instead of letting it fall.
    expect(wallHalfExtent(visibleHalfHeight(CAMERA_DISTANCE_MIN))).toBeGreaterThan(BODY_RADIUS);
  });

  it("always leaves the body somewhere to travel", () => {
    for (const framing of [CAMERA_DISTANCE_MIN, 1, CAMERA_DISTANCE_DEFAULT, CAMERA_DISTANCE_MAX]) {
      expect(wallHalfExtent(visibleHalfHeight(framing)) - BODY_RADIUS).toBeGreaterThan(0);
    }
  });

  it("still bounces a body back inside the frame, zoomed all the way in", () => {
    const halfExtent = wallHalfExtent(visibleHalfHeight(CAMERA_DISTANCE_MIN));
    const bounds = { minX: -halfExtent, maxX: halfExtent, minY: -halfExtent, maxY: halfExtent };
    const edge = halfExtent - BODY_RADIUS;

    const hit = reflectOffWalls(
      { x: edge + 0.05, y: 0 },
      { x: 4, y: 0 },
      bounds,
      BODY_RADIUS,
      0.65,
    );

    expect(hit.bounced).toBe(true);
    expect(hit.velocity.x).toBeLessThan(0);
    expect(Math.abs(hit.position.x)).toBeLessThanOrEqual(edge);
  });
});

describe("frameDelta", () => {
  it("runs at wall-clock speed by default", () => {
    expect(frameDelta(0.016, false)).toBeCloseTo(0.016);
  });

  it("stretches time while the secondary button is held", () => {
    expect(frameDelta(0.016, true)).toBeCloseTo(0.016 * SLOW_MOTION_SCALE);
    expect(frameDelta(0.016, true)).toBeLessThan(frameDelta(0.016, false));
  });

  it("caps a stalled frame so a backgrounded tab doesn't teleport the logo", () => {
    expect(frameDelta(3, false)).toBeLessThanOrEqual(0.05);
  });
});
