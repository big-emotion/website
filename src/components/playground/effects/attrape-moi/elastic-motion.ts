// The ball's physics, ported from the B2B espace's brand toy (b2b-space,
// BrandMotionStage): a frictionless, perfectly elastic bounce inside the unit square.
// Coordinates and velocities are normalized to the stage — [0,1] on both axes,
// stage-widths per second — so the maths never see a pixel; the engine maps them onto
// the DOM ball and the scene light each frame. Pure and canvas-free, like the other
// effects' math modules (DEC-031).

export type ElasticWall = "top" | "right" | "bottom" | "left";

export type ElasticBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type ElasticBallStep = {
  ball: ElasticBall;
  impact: ElasticWall | null;
};

export function advanceElasticBall(
  ball: ElasticBall,
  deltaSeconds: number,
  radius: number,
): ElasticBallStep {
  const min = radius;
  const max = 1 - radius;
  let x = ball.x + ball.vx * deltaSeconds;
  let y = ball.y + ball.vy * deltaSeconds;
  let vx = ball.vx;
  let vy = ball.vy;
  let impact: ElasticWall | null = null;

  if (x > max) {
    x = max - (x - max);
    vx = -Math.abs(vx);
    impact = "right";
  } else if (x < min) {
    x = min + (min - x);
    vx = Math.abs(vx);
    impact = "left";
  }

  if (y > max) {
    y = max - (y - max);
    vy = -Math.abs(vy);
    impact = "bottom";
  } else if (y < min) {
    y = min + (min - y);
    vy = Math.abs(vy);
    impact = "top";
  }

  return { ball: { x, y, vx, vy }, impact };
}
