import { describe, expect, it } from "vitest";
import { CAMERA } from "@/components/scene/states";
import { resolveFraming, scrubFraming, stepFraming, ZOOM_RATIO } from "./camera-framing";

const DEFAULT_HALF_ANGLE = Math.tan((CAMERA.fov * Math.PI) / 360);

/** What a visitor actually judges "zoomed in" by: how tall a slice of the world the
 *  frame covers. Half of it, at the distance the subject sits. */
function visibleHalfHeight(framing: number): number {
  const { distance, fov } = resolveFraming(framing, 1);
  return distance * Math.tan((fov * Math.PI) / 360);
}

describe("resolveFraming above the body floor", () => {
  it("just dollies: the camera sits at the framing, lens untouched", () => {
    expect(resolveFraming(2.6, 0.9)).toEqual({ distance: 2.6, fov: CAMERA.fov });
  });

  it("treats the floor itself as the last pure dolly position", () => {
    expect(resolveFraming(0.9, 0.9)).toEqual({ distance: 0.9, fov: CAMERA.fov });
  });
});

describe("resolveFraming below the body floor", () => {
  it("parks the camera on the floor instead of driving it into the subject", () => {
    expect(resolveFraming(0.3, 0.9).distance).toBe(0.9);
  });

  it("narrows the lens by whatever the camera stopped short of", () => {
    // Framing 0.3 against a floor of 0.9: the body covered a third of the way, so the
    // lens has to make up the other three.
    const tight = resolveFraming(0.3, 0.9);
    expect(Math.tan((tight.fov * Math.PI) / 360)).toBeCloseTo(DEFAULT_HALF_ANGLE / 3, 6);
  });

  it("magnifies exactly as much as a dolly to that framing would have", () => {
    // The whole point of the split: a visitor cannot tell which half moved. Three times
    // closer a framing, three times smaller a slice of world in frame.
    expect(visibleHalfHeight(0.5) / visibleHalfHeight(1.5)).toBeCloseTo(1 / 3, 6);
  });
});

describe("stepFraming", () => {
  it("closes in on the way in, backs off on the way out", () => {
    expect(stepFraming(3, "in")).toBeLessThan(3);
    expect(stepFraming(3, "out")).toBeGreaterThan(3);
  });

  it("moves the framing by the same ratio wherever the press lands", () => {
    // A fixed step is what a linear range gets away with. Over a range this wide it
    // would crawl through the far half and swallow the near half in two presses.
    expect(stepFraming(4, "in") / 4).toBeCloseTo(stepFraming(0.5, "in") / 0.5, 12);
  });

  it("comes straight back: one press out undoes one press in", () => {
    expect(stepFraming(stepFraming(2.6, "in"), "out")).toBeCloseTo(2.6, 12);
  });

  it("crosses a fifteenfold range in a handful of presses", () => {
    // A control that needs twenty presses to reach the detail reads as broken.
    expect(Math.ceil(Math.log(15) / Math.log(ZOOM_RATIO))).toBeLessThanOrEqual(10);
  });
});

describe("scrubFraming", () => {
  it("sends a scroll down away from the subject and a scroll up towards it", () => {
    expect(scrubFraming(3, 100, 0.001)).toBeGreaterThan(3);
    expect(scrubFraming(3, -100, 0.001)).toBeLessThan(3);
  });

  it("rides the same multiplicative axis the buttons do", () => {
    expect(scrubFraming(4, 100, 0.001) / 4).toBeCloseTo(scrubFraming(0.5, 100, 0.001) / 0.5, 12);
  });

  it("holds still on an idle wheel event", () => {
    expect(scrubFraming(3, 0, 0.001)).toBe(3);
  });
});
