// BIG BANG's device-capability tier ladder + fps watchdog (REQ-040): a vanilla port of
// the averaged-fps + hysteresis + flipflop-guard logic that used to lean on detect-gpu,
// rewritten as pure, timestamp-driven functions — no browser probe, no dependency,
// and the transitions/window are unit-testable without a real animation loop.

export type Tier = "T0" | "T1" | "T2";

const TIER_ORDER: readonly Tier[] = ["T0", "T1", "T2"];

/** Particle budget per tier. T2 is the full shatter; T0 is the mobile floor. */
export const TIER_PARTICLE_COUNT: Record<Tier, number> = {
  T0: 2500,
  T1: 8000,
  T2: 20000,
};

/** Rolling window the watchdog averages fps over before considering a tier change:
 *  short enough to react within a beat of the explode, long enough that one dropped
 *  frame can't trigger a downgrade on its own. */
export const WATCHDOG_WINDOW_MS = 400;

/** T2 requires staying at/above this floor (REQ-040's "≥30fps T2 floor"); an averaged
 *  window below it steps down to T1. */
export const T2_FLOOR_FPS = 30;
/** T1's own floor, one notch more forgiving — fewer particles tolerate a slower
 *  device before the watchdog gives up further and drops to T0. */
export const T1_FLOOR_FPS = 20;

const FLOOR_FPS: Record<Tier, number | null> = {
  T2: T2_FLOOR_FPS,
  T1: T1_FLOOR_FPS,
  T0: null, // nothing below T0 to fall back to
};

/** Hysteresis margin: a tier only upgrades once fps clears the *next* tier's floor by
 *  this much, so a device sitting right at a floor doesn't flip-flop every window. */
const UPGRADE_MARGIN_FPS = 10;

/** Minimum time between tier changes (flipflop guard): a window that would otherwise
 *  change tier is ignored while the last change is still this fresh. */
export const FLIPFLOP_COOLDOWN_MS = 2000;

export type DeviceHint = { deviceMemoryGb?: number; hardwareConcurrency?: number };

/** Starting tier from cheap, always-available device hints — no detect-gpu probe.
 *  Conservative on unknown values so an unrecognised browser starts mid-ladder rather
 *  than assuming the best case and immediately downgrading. */
export function selectInitialTier(hint: DeviceHint): Tier {
  const memory = hint.deviceMemoryGb ?? 4;
  const cores = hint.hardwareConcurrency ?? 4;
  if (memory >= 8 && cores >= 8) return "T2";
  if (memory >= 4 && cores >= 4) return "T1";
  return "T0";
}

export type WatchdogState = {
  tier: Tier;
  /** Frame deltas (ms) accumulated in the current window. */
  samples: readonly number[];
  windowStartMs: number;
  lastChangeMs: number;
};

export function createWatchdogState(tier: Tier, nowMs: number): WatchdogState {
  // Backdated past the cooldown so the very first window evaluated is free to change
  // tier — nothing has changed yet, so there is nothing for the flipflop guard to
  // debounce against.
  return { tier, samples: [], windowStartMs: nowMs, lastChangeMs: nowMs - FLIPFLOP_COOLDOWN_MS };
}

function stepDown(tier: Tier): Tier {
  const index = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, index - 1)];
}

function stepUp(tier: Tier): Tier {
  const index = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.min(TIER_ORDER.length - 1, index + 1)];
}

/** Feed one animation-loop frame in. Returns the (possibly unchanged) state; only once
 *  `WATCHDOG_WINDOW_MS` has elapsed since the window started does it average the
 *  samples and consider a tier change, gated by both hysteresis and the flipflop
 *  cooldown — otherwise it just accumulates the frame's delta. */
export function recordFrame(state: WatchdogState, nowMs: number, deltaMs: number): WatchdogState {
  const samples = [...state.samples, deltaMs];
  if (nowMs - state.windowStartMs < WATCHDOG_WINDOW_MS) {
    return { ...state, samples };
  }

  const avgDeltaMs = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const avgFps = 1000 / avgDeltaMs;
  const canChange = nowMs - state.lastChangeMs >= FLIPFLOP_COOLDOWN_MS;

  let tier = state.tier;
  if (canChange) {
    const floor = FLOOR_FPS[tier];
    if (floor !== null && avgFps < floor) {
      tier = stepDown(tier);
    } else {
      const upperTier = stepUp(tier);
      const upperFloor = FLOOR_FPS[upperTier];
      if (upperTier !== tier && upperFloor !== null && avgFps >= upperFloor + UPGRADE_MARGIN_FPS) {
        tier = upperTier;
      }
    }
  }

  return {
    tier,
    samples: [],
    windowStartMs: nowMs,
    lastChangeMs: tier !== state.tier ? nowMs : state.lastChangeMs,
  };
}
