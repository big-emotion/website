import { describe, expect, it } from "vitest";
import { applyDamping } from "./damping";

describe("applyDamping", () => {
  it("leaves velocity unchanged when no time has passed", () => {
    expect(applyDamping(10, 0, 0.5)).toBeCloseTo(10);
  });

  it("halves the velocity after exactly one half-life", () => {
    expect(applyDamping(10, 0.5, 0.5)).toBeCloseTo(5);
  });

  it("quarters the velocity after two half-lives", () => {
    expect(applyDamping(10, 1, 0.5)).toBeCloseTo(2.5);
  });

  it("keeps zero velocity at zero", () => {
    expect(applyDamping(0, 1, 0.5)).toBe(0);
  });

  it("never flips the sign of a decaying negative velocity", () => {
    expect(applyDamping(-4, 0.25, 0.5)).toBeLessThan(0);
  });

  it("decays monotonically as more time passes", () => {
    const after1 = applyDamping(10, 0.1, 0.5);
    const after2 = applyDamping(10, 0.2, 0.5);
    expect(Math.abs(after2)).toBeLessThan(Math.abs(after1));
  });
});
