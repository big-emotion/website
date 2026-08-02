import { describe, expect, it } from "vitest";
import { advanceElasticBall } from "./elastic-motion";

describe("advanceElasticBall", () => {
  // @req REQ-037
  it("moves without reporting an impact inside the stage", () => {
    const result = advanceElasticBall({ x: 0.4, y: 0.5, vx: 0.08, vy: -0.05 }, 0.5, 0.04);

    expect(result.ball).toEqual({ x: 0.44, y: 0.475, vx: 0.08, vy: -0.05 });
    expect(result.impact).toBeNull();
  });

  // @req REQ-037
  it("mirrors the overshoot back inside and reverses velocity at the right wall", () => {
    const result = advanceElasticBall({ x: 0.94, y: 0.5, vx: 0.08, vy: 0.03 }, 0.5, 0.04);

    expect(result.ball.x).toBeLessThanOrEqual(0.96);
    expect(result.ball.vx).toBe(-0.08);
    expect(result.impact).toBe("right");
  });

  // @req REQ-037
  it("reflects off the left wall by forcing the velocity positive", () => {
    const result = advanceElasticBall({ x: 0.05, y: 0.5, vx: -0.08, vy: 0 }, 0.5, 0.04);

    expect(result.ball.x).toBeGreaterThanOrEqual(0.04);
    expect(result.ball.vx).toBe(0.08);
    expect(result.impact).toBe("left");
  });

  // @req REQ-037
  it("reflects vertical velocity at the top wall", () => {
    const result = advanceElasticBall({ x: 0.4, y: 0.05, vx: 0.06, vy: -0.08 }, 0.5, 0.04);

    expect(result.ball.y).toBeGreaterThanOrEqual(0.04);
    expect(result.ball.vy).toBe(0.08);
    expect(result.impact).toBe("top");
  });

  // @req REQ-037
  it("reflects vertical velocity at the bottom wall", () => {
    const result = advanceElasticBall({ x: 0.4, y: 0.95, vx: 0, vy: 0.08 }, 0.5, 0.04);

    expect(result.ball.y).toBeLessThanOrEqual(0.96);
    expect(result.ball.vy).toBe(-0.08);
    expect(result.impact).toBe("bottom");
  });

  // @req REQ-037
  it("stays perfectly elastic: speed is conserved across a bounce", () => {
    const before = { x: 0.94, y: 0.5, vx: 0.08, vy: 0.03 };
    const { ball: after } = advanceElasticBall(before, 0.5, 0.04);

    expect(Math.hypot(after.vx, after.vy)).toBeCloseTo(Math.hypot(before.vx, before.vy));
  });
});
