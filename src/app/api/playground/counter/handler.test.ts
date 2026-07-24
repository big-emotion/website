import { describe, expect, it, vi } from "vitest";
import type { CounterState } from "@/lib/playground-counter";
import { handleGetCounter, handlePostCounter } from "./handler";

const allow = { check: () => false };

function jsonRequest(body: unknown): Request {
  return new Request("https://big-emotion.com/api/playground/counter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleGetCounter", () => {
  it("returns the current total", async () => {
    const getTotal = vi.fn().mockResolvedValue(431);

    const res = await handleGetCounter({ getTotal });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 431 });
  });
});

describe("handlePostCounter", () => {
  it("increments and returns the new total", async () => {
    const incrementCounter = vi
      .fn()
      .mockResolvedValue({ total: 5, byEffect: { lumiere: 5 } } satisfies CounterState);

    const res = await handlePostCounter(
      jsonRequest({ increments: [{ effectId: "lumiere", amount: 5 }] }),
      { rateLimiter: allow, incrementCounter },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 5 });
    expect(incrementCounter).toHaveBeenCalledWith([{ effectId: "lumiere", amount: 5 }]);
  });

  it("forwards an over-cap amount to the lib rather than rejecting it (clamp lives there)", async () => {
    const incrementCounter = vi
      .fn()
      .mockResolvedValue({ total: 50, byEffect: { lumiere: 50 } } satisfies CounterState);

    const res = await handlePostCounter(
      jsonRequest({ increments: [{ effectId: "lumiere", amount: 5_000 }] }),
      { rateLimiter: allow, incrementCounter },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 50 });
    expect(incrementCounter).toHaveBeenCalledWith([{ effectId: "lumiere", amount: 5_000 }]);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await handlePostCounter(
      new Request("https://big-emotion.com/api/playground/counter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      }),
      { rateLimiter: allow, incrementCounter: vi.fn() },
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when a required field is missing", async () => {
    const res = await handlePostCounter(jsonRequest({ increments: [{ effectId: "lumiere" }] }), {
      rateLimiter: allow,
      incrementCounter: vi.fn(),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for an oversized payload (too many batched entries)", async () => {
    const increments = Array.from({ length: 21 }, (_, i) => ({ effectId: `e${i}`, amount: 1 }));

    const res = await handlePostCounter(jsonRequest({ increments }), {
      rateLimiter: allow,
      incrementCounter: vi.fn(),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for a negative amount", async () => {
    const res = await handlePostCounter(
      jsonRequest({ increments: [{ effectId: "lumiere", amount: -1 }] }),
      { rateLimiter: allow, incrementCounter: vi.fn() },
    );

    expect(res.status).toBe(400);
  });

  it("returns 429 when the rate limiter blocks the IP", async () => {
    const incrementCounter = vi.fn();

    const res = await handlePostCounter(
      jsonRequest({ increments: [{ effectId: "lumiere", amount: 1 }] }),
      { rateLimiter: { check: () => true }, incrementCounter },
    );

    expect(res.status).toBe(429);
    expect(incrementCounter).not.toHaveBeenCalled();
  });

  it("degrades gracefully to a 500 rather than throwing when persistence fails", async () => {
    const incrementCounter = vi.fn().mockRejectedValue(new Error("disk full"));

    const res = await handlePostCounter(
      jsonRequest({ increments: [{ effectId: "lumiere", amount: 1 }] }),
      { rateLimiter: allow, incrementCounter },
    );

    expect(res.status).toBe(500);
  });
});
