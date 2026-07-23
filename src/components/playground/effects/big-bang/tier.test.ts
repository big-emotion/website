import { describe, expect, it } from "vitest";
import {
  createWatchdogState,
  FLIPFLOP_COOLDOWN_MS,
  recordFrame,
  selectInitialTier,
  T1_FLOOR_FPS,
  T2_FLOOR_FPS,
  TIER_PARTICLE_COUNT,
  WATCHDOG_WINDOW_MS,
} from "./tier";

/** 400ms of frames at a steady fps, so the window closes on the last one. */
function feedSteadyFps(state: ReturnType<typeof createWatchdogState>, fps: number, startMs: number) {
  const deltaMs = 1000 / fps;
  let now = startMs;
  let next = state;
  while (now - startMs < WATCHDOG_WINDOW_MS) {
    now += deltaMs;
    next = recordFrame(next, now, deltaMs);
  }
  return { state: next, endMs: now };
}

describe("selectInitialTier", () => {
  it("starts at T2 on a high-memory, multi-core device", () => {
    expect(selectInitialTier({ deviceMemoryGb: 8, hardwareConcurrency: 8 })).toBe("T2");
  });

  it("starts at T1 on a mid-tier device", () => {
    expect(selectInitialTier({ deviceMemoryGb: 4, hardwareConcurrency: 4 })).toBe("T1");
  });

  it("starts at T0 on a low-memory or low-core device", () => {
    expect(selectInitialTier({ deviceMemoryGb: 2, hardwareConcurrency: 2 })).toBe("T0");
  });

  it("defaults to T1 when hints are unavailable rather than assuming the best case", () => {
    expect(selectInitialTier({})).toBe("T1");
  });
});

describe("TIER_PARTICLE_COUNT", () => {
  it("grows monotonically from T0 to T2", () => {
    expect(TIER_PARTICLE_COUNT.T0).toBeLessThan(TIER_PARTICLE_COUNT.T1);
    expect(TIER_PARTICLE_COUNT.T1).toBeLessThan(TIER_PARTICLE_COUNT.T2);
  });
});

describe("recordFrame — 400ms averaging window", () => {
  it("does not evaluate a tier change before the window elapses", () => {
    const state = createWatchdogState("T2", 0);
    const afterOneFrame = recordFrame(state, 16, 16);
    expect(afterOneFrame.tier).toBe("T2");
    expect(afterOneFrame.samples).toEqual([16]);
  });

  it("evaluates and resets the window once WATCHDOG_WINDOW_MS has elapsed", () => {
    const state = createWatchdogState("T1", 0);
    const { state: result, endMs } = feedSteadyFps(state, 60, 0);
    expect(endMs).toBeGreaterThanOrEqual(WATCHDOG_WINDOW_MS);
    expect(result.samples).toEqual([]);
    expect(result.windowStartMs).toBe(endMs);
  });
});

describe("recordFrame — hysteresis transitions", () => {
  it("downgrades T2 to T1 once averaged fps drops below the T2 floor", () => {
    const state = createWatchdogState("T2", 0);
    const { state: result } = feedSteadyFps(state, T2_FLOOR_FPS - 5, 0);
    expect(result.tier).toBe("T1");
  });

  it("stays at T2 when averaged fps sits right at the floor", () => {
    const state = createWatchdogState("T2", 0);
    const { state: result } = feedSteadyFps(state, T2_FLOOR_FPS, 0);
    expect(result.tier).toBe("T2");
  });

  it("downgrades T1 to T0 once averaged fps drops below the T1 floor", () => {
    const state = createWatchdogState("T1", 0);
    const { state: result } = feedSteadyFps(state, T1_FLOOR_FPS - 5, 0);
    expect(result.tier).toBe("T0");
  });

  it("never downgrades below T0", () => {
    const state = createWatchdogState("T0", 0);
    const { state: result } = feedSteadyFps(state, 5, 0);
    expect(result.tier).toBe("T0");
  });

  it("does not upgrade T1 to T2 just above the T2 floor (hysteresis margin)", () => {
    const state = createWatchdogState("T1", 0);
    const { state: result } = feedSteadyFps(state, T2_FLOOR_FPS + 2, 0);
    expect(result.tier).toBe("T1");
  });

  it("upgrades T1 to T2 once fps clears the floor by the hysteresis margin", () => {
    const state = createWatchdogState("T1", 0);
    const { state: result } = feedSteadyFps(state, T2_FLOOR_FPS + 15, 0);
    expect(result.tier).toBe("T2");
  });

  it("upgrades T0 to T1 once fps clears the T1 floor by the hysteresis margin", () => {
    const state = createWatchdogState("T0", 0);
    const { state: result } = feedSteadyFps(state, T1_FLOOR_FPS + 15, 0);
    expect(result.tier).toBe("T1");
  });
});

describe("recordFrame — flipflop guard", () => {
  it("suppresses a second tier change inside the cooldown window", () => {
    const initial = createWatchdogState("T2", 0);
    const { state: afterDrop, endMs: dropEndMs } = feedSteadyFps(initial, T2_FLOOR_FPS - 5, 0);
    expect(afterDrop.tier).toBe("T1");

    // A very short window right after, still well within the flipflop cooldown, is
    // fast enough to clear the T2 upgrade margin but must be ignored.
    const { state: afterRecover } = feedSteadyFps(afterDrop, T2_FLOOR_FPS + 15, dropEndMs);
    expect(afterRecover.tier).toBe("T1");
  });

  it("allows a change again once the cooldown has elapsed", () => {
    const initial = createWatchdogState("T2", 0);
    const { state: afterDrop, endMs: dropEndMs } = feedSteadyFps(initial, T2_FLOOR_FPS - 5, 0);
    expect(afterDrop.tier).toBe("T1");

    const pastCooldown = dropEndMs + FLIPFLOP_COOLDOWN_MS;
    const { state: afterRecover } = feedSteadyFps(afterDrop, T2_FLOOR_FPS + 15, pastCooldown);
    expect(afterRecover.tier).toBe("T2");
  });
});
