// Hand-rolled physics core (DEC-031): one body, elastic viewport walls, no engine
// dependency (rapier measured at 836 KB gz, cannon-es frozen — 0 KB is the budget).
// Every function here is pure and canvas-free so it's unit-testable without a
// renderer; `engine.ts` is the only caller, driving these each animation frame.

export type Vec2 = { x: number; y: number };

export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

export type PointerSample = { x: number; y: number; t: number };

/** Semi-implicit Euler: velocity absorbs acceleration first, then position absorbs
 *  the updated velocity — stable enough for a single body at interactive frame rates. */
export function stepMotion(position: Vec2, velocity: Vec2, acceleration: Vec2, dt: number) {
  const nextVelocity: Vec2 = {
    x: velocity.x + acceleration.x * dt,
    y: velocity.y + acceleration.y * dt,
  };
  const nextPosition: Vec2 = {
    x: position.x + nextVelocity.x * dt,
    y: position.y + nextVelocity.y * dt,
  };
  return { position: nextPosition, velocity: nextVelocity };
}

/** Elastic reflection off the four viewport walls. `radius` shrinks the playable
 *  bounds so the body's edge (not its center) is what touches the wall; a bounce
 *  mirrors the overshoot back inside and scales velocity by `restitution`
 *  (1 = perfectly elastic, <1 loses energy per bounce so the toy settles). */
export function reflectOffWalls(
  position: Vec2,
  velocity: Vec2,
  bounds: Bounds,
  radius: number,
  restitution: number,
): { position: Vec2; velocity: Vec2; bounced: boolean } {
  const edgeMinX = bounds.minX + radius;
  const edgeMaxX = bounds.maxX - radius;
  const edgeMinY = bounds.minY + radius;
  const edgeMaxY = bounds.maxY - radius;

  let x = position.x;
  let y = position.y;
  let vx = velocity.x;
  let vy = velocity.y;
  let bounced = false;

  if (x > edgeMaxX) {
    x = edgeMaxX - (x - edgeMaxX);
    vx = -vx * restitution;
    bounced = true;
  } else if (x < edgeMinX) {
    x = edgeMinX + (edgeMinX - x);
    vx = -vx * restitution;
    bounced = true;
  }

  if (y > edgeMaxY) {
    y = edgeMaxY - (y - edgeMaxY);
    vy = -vy * restitution;
    bounced = true;
  } else if (y < edgeMinY) {
    y = edgeMinY + (edgeMinY - y);
    vy = -vy * restitution;
    bounced = true;
  }

  return { position: { x, y }, velocity: { x: vx, y: vy }, bounced };
}

const DEFAULT_SAMPLE_WINDOW_MS = 200;

/** Derives a throw velocity from a short pointer-position history: the oldest sample
 *  still inside `windowMs` of the newest one, divided by the elapsed time. Recent
 *  samples dominate — a long, slow drag doesn't inflate the final flick's velocity. */
export function sampleVelocity(
  samples: readonly PointerSample[],
  windowMs = DEFAULT_SAMPLE_WINDOW_MS,
): Vec2 {
  if (samples.length < 2) return { x: 0, y: 0 };

  const newest = samples[samples.length - 1];
  const cutoff = newest.t - windowMs;
  const oldest = samples.find((sample) => sample.t >= cutoff) ?? newest;

  const dt = (newest.t - oldest.t) / 1000;
  if (dt <= 0) return { x: 0, y: 0 };

  return { x: (newest.x - oldest.x) / dt, y: (newest.y - oldest.y) / dt };
}

function speed(velocity: Vec2): number {
  return Math.hypot(velocity.x, velocity.y);
}

/** Below this speed the body is treated as settled (stops the animation loop). */
export function isAtRest(velocity: Vec2, threshold: number): boolean {
  return speed(velocity) <= threshold;
}

/** Above this speed a pointer release counts as a throw rather than a drop. */
export function isThrow(velocity: Vec2, threshold: number): boolean {
  return speed(velocity) >= threshold;
}

/** Free-spinning core torque: advances angle by the current angular velocity, then
 *  damps that velocity (linear per-second decay) so a spin imparted by a drag or
 *  bounce settles instead of spinning forever. */
export function stepTorque(angle: number, angularVelocity: number, damping: number, dt: number) {
  const nextAngle = angle + angularVelocity * dt;
  const nextAngularVelocity = angularVelocity * (1 - damping * dt);
  return { angle: nextAngle, angularVelocity: nextAngularVelocity };
}
