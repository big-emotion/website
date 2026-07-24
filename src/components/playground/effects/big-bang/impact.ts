// BIG BANG's impact model (REQ-040): a click blows out the patch of chrome it landed on
// and the surface springs back, rather than the whole wordmark dissolving and healing.
//
// The first cut shattered everything on one global progress uniform, which is why a tap
// read as an orange stain spreading over the screen and returning on a timer nobody
// asked for. Here each click is its own short-lived, positioned event: the mesh bulges
// away from the hit point and settles, sparks fly off it, and up to
// MAX_CONCURRENT_IMPACTS of those can be in flight so clicking again never has to wait.
//
// Everything in this module is pure and renderer-free, so the timing curve and the pool
// are proved without a WebGL context; `big-bang-effect.tsx` is the only caller.

import type { Tier } from "./tier";
import { TIER_PARTICLE_COUNT } from "./tier";

/** How long one impact lives, from click to settled. Short: the wow is the snap, and a
 *  long tail would collide with the next click. */
export const IMPACT_DURATION_S = 0.9;

/** How far along the surface an impact reaches, in the rig's unit-scaled space (the
 *  whole wordmark is 1 unit across) — a patch, not the mark. */
export const IMPACT_RADIUS = 0.22;

/** Peak displacement at the hit point, same units. Tuned to break the silhouette
 *  clearly without throwing the geometry far enough to read as a glitch. */
export const IMPACT_AMPLITUDE = 0.13;

/** Size of the impact pool. Three is enough to keep rapid clicking fluid and keeps the
 *  shader's loop short — it is unrolled at compile time. */
export const MAX_CONCURRENT_IMPACTS = 3;

/** Fraction of the burst spent travelling out before the surface starts returning. */
const ATTACK_FRACTION = 0.12;

/**
 * The 0→1→0 curve one impact drives, in seconds since the click. It leaves fast and
 * comes back slowly: a symmetric curve reads as a breath, not as a hit.
 */
export function burstEnvelope(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || elapsedSeconds >= IMPACT_DURATION_S) return 0;

  const attackSeconds = IMPACT_DURATION_S * ATTACK_FRACTION;
  if (elapsedSeconds < attackSeconds) return elapsedSeconds / attackSeconds;

  const decayed = (elapsedSeconds - attackSeconds) / (IMPACT_DURATION_S - attackSeconds);
  return (1 - decayed) * (1 - decayed);
}

/**
 * Which pool slot the next click should claim: a finished burst if there is one,
 * otherwise the one that started longest ago. Clicking faster than bursts expire is
 * the effect working as intended, so a full pool recycles rather than dropping the hit.
 */
export function nextImpactSlot(startTimes: readonly number[], nowSeconds: number): number {
  const free = startTimes.findIndex((start) => nowSeconds - start >= IMPACT_DURATION_S);
  if (free !== -1) return free;

  return startTimes.reduce(
    (oldest, start, index) => (start < startTimes[oldest] ? index : oldest),
    0,
  );
}

/** Sparks thrown by one burst. The tier ladder budgets a full-mesh shatter across the
 *  whole stage; one burst covers a patch the size of IMPACT_RADIUS and a full pool of
 *  them has to fit inside that budget, so it takes a small fraction of it. Denser than
 *  this and the sparks curtain the wordmark rather than scarring it. */
export function burstParticleCount(tier: Tier): number {
  return Math.floor(TIER_PARTICLE_COUNT[tier] / 25);
}
