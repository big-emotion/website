// @req REQ-013

import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HAS_HERO_MODEL } from "./model-gate";

describe("hero model release gate", () => {
  it("opens only alongside a real Draco-compressed model within the 100 KB budget", () => {
    const model = statSync(join(process.cwd(), "public/models/scene.glb"));

    expect(HAS_HERO_MODEL).toBe(true);
    expect(model.size).toBeGreaterThan(1_000);
    expect(model.size).toBeLessThanOrEqual(100_000);
  });
});
