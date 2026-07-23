import { describe, expect, it } from "vitest";
import { playgroundEffects } from "./effects";

describe("playgroundEffects", () => {
  it("ships empty in v1, per the 0 KB shell budget (DEC-030)", () => {
    expect(playgroundEffects).toEqual([]);
  });
});
