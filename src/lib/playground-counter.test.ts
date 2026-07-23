import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getTotal, incrementCounter, MAX_INCREMENT } from "./playground-counter";

let dir: string;
let filePath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "playground-counter-"));
  filePath = join(dir, "counter.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("getTotal", () => {
  it("starts at zero when no file has been written yet", async () => {
    expect(await getTotal(filePath)).toBe(0);
  });
});

describe("incrementCounter", () => {
  it("adds the increment to the total and returns the new state", async () => {
    const state = await incrementCounter([{ effectId: "big-bang", amount: 3 }], filePath);
    expect(state.total).toBe(3);
    expect(state.byEffect["big-bang"]).toBe(3);
  });

  it("accumulates across multiple entries in one batch", async () => {
    const state = await incrementCounter(
      [
        { effectId: "big-bang", amount: 2 },
        { effectId: "big-bang", amount: 1 },
        { effectId: "other-effect", amount: 4 },
      ],
      filePath,
    );
    expect(state.total).toBe(7);
    expect(state.byEffect).toEqual({ "big-bang": 3, "other-effect": 4 });
  });

  it("clamps a single increment to the sane max instead of rejecting it", async () => {
    const state = await incrementCounter(
      [{ effectId: "big-bang", amount: MAX_INCREMENT * 10 }],
      filePath,
    );
    expect(state.total).toBe(MAX_INCREMENT);
  });

  it("ignores non-positive or non-finite amounts without throwing", async () => {
    const state = await incrementCounter(
      [
        { effectId: "big-bang", amount: 0 },
        { effectId: "big-bang", amount: -5 },
        { effectId: "big-bang", amount: Number.NaN },
      ],
      filePath,
    );
    expect(state.total).toBe(0);
  });

  it("survives a simulated process restart: the total round-trips through a fresh read", async () => {
    await incrementCounter([{ effectId: "big-bang", amount: 5 }], filePath);

    // Nothing here is cached in module state across these two calls beyond the
    // file path, so re-reading is indistinguishable from a fresh process reading
    // the file after a restart.
    expect(await getTotal(filePath)).toBe(5);

    await incrementCounter([{ effectId: "big-bang", amount: 2 }], filePath);
    expect(await getTotal(filePath)).toBe(7);
  });

  it("does not corrupt the file under concurrent increments (serialized atomic writes)", async () => {
    const writers = Array.from({ length: 20 }, () =>
      incrementCounter([{ effectId: "big-bang", amount: 1 }], filePath),
    );
    await Promise.all(writers);

    expect(await getTotal(filePath)).toBe(20);
    // The file itself must still be valid, single JSON object — never a partial
    // write left behind by two writers racing.
    const raw = await readFile(filePath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("persists only integer counts keyed by effect id — no PII", async () => {
    await incrementCounter([{ effectId: "big-bang", amount: 3 }], filePath);

    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    expect(Object.keys(parsed).sort()).toEqual(["byEffect", "total"]);
    expect(typeof parsed.total).toBe("number");
    for (const [effectId, count] of Object.entries(parsed.byEffect)) {
      expect(typeof effectId).toBe("string");
      expect(Number.isInteger(count)).toBe(true);
    }

    // No visitor-identifying fields anywhere in the payload.
    const disallowed = ["ip", "email", "session", "timestamp", "userAgent", "cookie"];
    const lowerRaw = raw.toLowerCase();
    for (const field of disallowed) {
      expect(lowerRaw).not.toContain(field.toLowerCase());
    }
  });
});
