import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, createInMemoryRateLimiter } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const key = "user-a";
    const opts = { limit: 3, windowMs: 60_000 };
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
  });

  it("refuses once the limit is exceeded within the window", () => {
    const key = "user-b";
    const opts = { limit: 2, windowMs: 60_000 };
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(false);
  });

  it("resets once the window elapses", () => {
    const key = "user-c";
    const opts = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(key, opts).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit("user-d", opts).allowed).toBe(true);
    expect(checkRateLimit("user-e", opts).allowed).toBe(true);
    expect(checkRateLimit("user-d", opts).allowed).toBe(false);
  });
});

describe("createInMemoryRateLimiter", () => {
  it("allows the first attempt from a key", () => {
    const limiter = createInMemoryRateLimiter({ now: () => 0 });
    expect(limiter.check("ip")).toBe(false);
  });

  it("blocks a second attempt inside the minimum interval, then frees it", () => {
    let clock = 0;
    const limiter = createInMemoryRateLimiter({ minIntervalMs: 20_000, now: () => clock });

    expect(limiter.check("ip")).toBe(false);
    clock = 5_000;
    expect(limiter.check("ip")).toBe(true);
    clock = 25_000;
    expect(limiter.check("ip")).toBe(false);
  });

  it("blocks once the hourly cap is reached", () => {
    let clock = 0;
    const limiter = createInMemoryRateLimiter({ maxPerHour: 3, minIntervalMs: 0, now: () => clock });

    expect(limiter.check("ip")).toBe(false);
    clock += 1;
    expect(limiter.check("ip")).toBe(false);
    clock += 1;
    expect(limiter.check("ip")).toBe(false);
    clock += 1;
    expect(limiter.check("ip")).toBe(true);
  });

  it("frees the hourly window after an hour", () => {
    let clock = 0;
    const limiter = createInMemoryRateLimiter({ maxPerHour: 2, minIntervalMs: 0, now: () => clock });

    limiter.check("ip");
    limiter.check("ip");
    expect(limiter.check("ip")).toBe(true);

    clock += 3_600_001;
    expect(limiter.check("ip")).toBe(false);
  });

  it("throttles each key independently", () => {
    const limiter = createInMemoryRateLimiter({ minIntervalMs: 20_000, now: () => 0 });

    expect(limiter.check("a")).toBe(false);
    expect(limiter.check("b")).toBe(false);
  });
});
