import { describe, expect, it } from "vitest";
import {
  ALIGNMENT_HOLD_MS,
  ALIGNMENT_THRESHOLD_DEG,
  INITIAL_ALIGNMENT_STATE,
  updateAlignment,
} from "./alignment-detector";

describe("updateAlignment", () => {
  it("starts unaligned with no dwell", () => {
    expect(INITIAL_ALIGNMENT_STATE).toEqual({ dwellMs: 0, aligned: false });
  });

  it("does not align before the hold duration elapses, even dead-on the key light", () => {
    const state = updateAlignment(INITIAL_ALIGNMENT_STATE, 0, ALIGNMENT_HOLD_MS - 1);
    expect(state.aligned).toBe(false);
  });

  it("aligns once cumulative dwell within threshold reaches the hold duration", () => {
    let state = updateAlignment(INITIAL_ALIGNMENT_STATE, 2, ALIGNMENT_HOLD_MS / 2);
    state = updateAlignment(state, 2, ALIGNMENT_HOLD_MS / 2);
    expect(state.aligned).toBe(true);
  });

  it("does not align just outside the angle threshold", () => {
    const state = updateAlignment(
      INITIAL_ALIGNMENT_STATE,
      ALIGNMENT_THRESHOLD_DEG + 0.1,
      ALIGNMENT_HOLD_MS * 2,
    );
    expect(state.aligned).toBe(false);
  });

  it("accepts the angle threshold itself as aligned", () => {
    const state = updateAlignment(INITIAL_ALIGNMENT_STATE, ALIGNMENT_THRESHOLD_DEG, ALIGNMENT_HOLD_MS);
    expect(state.aligned).toBe(true);
  });

  it("resets dwell as soon as the angle drifts back out of threshold", () => {
    let state = updateAlignment(INITIAL_ALIGNMENT_STATE, 1, ALIGNMENT_HOLD_MS - 100);
    state = updateAlignment(state, 20, 16);
    expect(state).toEqual({ dwellMs: 0, aligned: false });
  });

  it("stays aligned while dwell keeps accumulating past the hold duration", () => {
    let state = updateAlignment(INITIAL_ALIGNMENT_STATE, 0, ALIGNMENT_HOLD_MS);
    state = updateAlignment(state, 0, 500);
    expect(state.aligned).toBe(true);
  });
});
