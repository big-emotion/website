// The gallery previews' cinematics (PG-03's teaser, hover-driven). Each card samples its
// effect rather than embedding it: LUMIERE turns the mark towards the pointer, POIDS
// LOURD drops it, BIG BANG blows it apart — the third reuses big-bang's own
// `burstEnvelope`, so the teaser and the effect it advertises share one curve.
//
// Pure and renderer-free, like every other motion module here: `runtime.ts` is the only
// caller and it just reads these each frame.

/** How far the mark turns when the pointer reaches the edge of the card. Small: a
 *  preview that spins hard reads as broken rather than as an invitation. */
export const MAX_YAW_RADIANS = 0.55;
export const MAX_PITCH_RADIANS = 0.32;

/** Where the mark floats at rest, and the floor it lands on — the preview box is short,
 *  so the whole fall is well under one world unit. */
export const DROP_REST_HEIGHT = 0.26;
export const DROP_FLOOR = -0.22;

const DROP_GRAVITY = 3.4;
const DROP_RESTITUTION = 0.42;
/** A bounce slower than this is not worth drawing; the mark is declared landed. */
const MIN_BOUNCE_SPEED = 0.12;

/** When the drop has certainly finished — the tests and the runtime both need a moment
 *  they can call "settled", and the bounce series converges well before this. */
export const DROP_SETTLED_S = 2.5;

function clampUnit(value: number): number {
  return Math.min(1, Math.max(-1, value));
}

/**
 * Where the mark should face for a pointer at (nx, ny), each in −1..1 across the card.
 * Pitch is inverted: moving the pointer up should tip the mark's face up towards it.
 */
export function pointerYawPitch(nx: number, ny: number): { yaw: number; pitch: number } {
  return {
    yaw: clampUnit(nx) * MAX_YAW_RADIANS,
    pitch: -clampUnit(ny) * MAX_PITCH_RADIANS,
  };
}

/**
 * Height of the falling mark, in seconds since the drop started. Closed-form rather than
 * integrated: the runtime can then jump straight to any point of the fall, and the curve
 * is provable without stepping a simulation.
 *
 * Successive parabolic arcs, each launched at the previous one's impact speed scaled by
 * the restitution. The series converges geometrically, so the loop terminates.
 */
export function dropHeight(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return DROP_REST_HEIGHT;

  const fallSeconds = Math.sqrt((2 * (DROP_REST_HEIGHT - DROP_FLOOR)) / DROP_GRAVITY);
  if (elapsedSeconds < fallSeconds) {
    return DROP_REST_HEIGHT - 0.5 * DROP_GRAVITY * elapsedSeconds * elapsedSeconds;
  }

  let remaining = elapsedSeconds - fallSeconds;
  let speed = DROP_GRAVITY * fallSeconds * DROP_RESTITUTION;

  while (speed > MIN_BOUNCE_SPEED) {
    const arcSeconds = (2 * speed) / DROP_GRAVITY;
    if (remaining < arcSeconds) {
      return DROP_FLOOR + speed * remaining - 0.5 * DROP_GRAVITY * remaining * remaining;
    }
    remaining -= arcSeconds;
    speed *= DROP_RESTITUTION;
  }

  return DROP_FLOOR;
}
