import { describe, expect, it } from "vitest";
import {
  burstEnvelope,
  burstParticleCount,
  IMPACT_DURATION_S,
  MAX_CONCURRENT_IMPACTS,
  nextImpactSlot,
} from "./impact";
import { TIER_PARTICLE_COUNT } from "./tier";

describe("burstEnvelope", () => {
  it("is at rest before the impact and once it has run its course", () => {
    expect(burstEnvelope(-1)).toBe(0);
    expect(burstEnvelope(0)).toBe(0);
    expect(burstEnvelope(IMPACT_DURATION_S)).toBe(0);
    expect(burstEnvelope(IMPACT_DURATION_S + 5)).toBe(0);
  });

  // The surface has to leave fast and come back slowly, or the hit reads as a swell
  // rather than as something breaking.
  it("peaks in the first fifth of the burst, then decays", () => {
    const samples = Array.from({ length: 40 }, (_, i) => {
      const t = ((i + 1) / 40) * IMPACT_DURATION_S;
      return { t, value: burstEnvelope(t) };
    });
    const peak = samples.reduce((best, s) => (s.value > best.value ? s : best));

    expect(peak.value).toBeCloseTo(1, 1);
    expect(peak.t).toBeLessThan(IMPACT_DURATION_S / 5);
  });

  it("never pulls the surface inward", () => {
    for (let t = -0.5; t < IMPACT_DURATION_S + 0.5; t += 0.01) {
      expect(burstEnvelope(t)).toBeGreaterThanOrEqual(0);
    }
  });

  it("decays monotonically once past the peak", () => {
    const afterPeak = Array.from({ length: 20 }, (_, i) =>
      burstEnvelope(IMPACT_DURATION_S * (0.3 + (i / 20) * 0.7)),
    );

    for (let i = 1; i < afterPeak.length; i += 1) {
      expect(afterPeak[i]).toBeLessThanOrEqual(afterPeak[i - 1]);
    }
  });
});

describe("nextImpactSlot", () => {
  const spent = Array.from({ length: MAX_CONCURRENT_IMPACTS }, () => -IMPACT_DURATION_S * 2);

  it("takes a slot whose burst has already finished", () => {
    expect(nextImpactSlot(spent, 0)).toBe(0);
  });

  it("fills the free slots before reusing a live one", () => {
    const oneLive = [0.1, ...spent.slice(1)];

    expect(nextImpactSlot(oneLive, 0.2)).toBe(1);
  });

  // Clicking faster than bursts expire is the point of the effect ("chainable chaos"),
  // so a full pool recycles the oldest rather than dropping the click on the floor.
  it("recycles the oldest burst when every slot is live", () => {
    const allLive = [0.5, 0.1, 0.9].slice(0, MAX_CONCURRENT_IMPACTS);

    expect(nextImpactSlot(allLive, 1)).toBe(1);
  });
});

describe("burstParticleCount", () => {
  it("scales with the device tier", () => {
    expect(burstParticleCount("T0")).toBeLessThan(burstParticleCount("T1"));
    expect(burstParticleCount("T1")).toBeLessThan(burstParticleCount("T2"));
  });

  // The tier budget is the whole-stage ceiling; one burst covers a patch of the logo and
  // up to MAX_CONCURRENT_IMPACTS of them can be alive at once, so a burst has to cost a
  // fraction of it rather than all of it.
  it("leaves room for a full pool of concurrent bursts inside the tier budget", () => {
    for (const tier of ["T0", "T1", "T2"] as const) {
      expect(burstParticleCount(tier) * MAX_CONCURRENT_IMPACTS).toBeLessThan(
        TIER_PARTICLE_COUNT[tier],
      );
    }
  });
});
