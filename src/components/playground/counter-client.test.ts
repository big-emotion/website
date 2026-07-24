import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COUNTER_UPDATED_EVENT, createCounterBatcher } from "./counter-client";

describe("createCounterBatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("coalesces rapid plays of the same effect into one POST", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { addEventListener: vi.fn() });

    const batcher = createCounterBatcher();
    batcher.recordPlay("lumiere");
    batcher.recordPlay("lumiere");
    batcher.recordPlay("lumiere");

    vi.advanceTimersByTime(5_000);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/playground/counter");
    expect(JSON.parse(init.body)).toEqual({ increments: [{ effectId: "lumiere", amount: 3 }] });
  });

  it("batches multiple different effects into the same flush", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { addEventListener: vi.fn() });

    const batcher = createCounterBatcher();
    batcher.recordPlay("lumiere");
    batcher.recordPlay("other-effect", 2);

    batcher.flush();

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).increments).toEqual(
      expect.arrayContaining([
        { effectId: "lumiere", amount: 1 },
        { effectId: "other-effect", amount: 2 },
      ]),
    );
  });

  it("does nothing when flushed with an empty queue", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { addEventListener: vi.fn() });

    createCounterBatcher().flush();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prefers sendBeacon when available, and does not also call fetch", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("window", { addEventListener: vi.fn() });

    const batcher = createCounterBatcher();
    batcher.recordPlay("lumiere");
    batcher.flush();

    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to fetch when sendBeacon reports failure", () => {
    const sendBeacon = vi.fn().mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("window", { addEventListener: vi.fn() });

    const batcher = createCounterBatcher();
    batcher.recordPlay("lumiere");
    batcher.flush();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("never throws when the request fails — the counter must not block play", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { addEventListener: vi.fn() });

    const batcher = createCounterBatcher();
    batcher.recordPlay("lumiere");

    expect(() => batcher.flush()).not.toThrow();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it("dispatches a counter-updated event with the fresh total after a successful flush", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ total: 42 }) });
    const dispatchEvent = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { addEventListener: vi.fn(), dispatchEvent });

    const batcher = createCounterBatcher();
    batcher.recordPlay("lumiere");
    batcher.flush();

    await vi.waitFor(() => expect(dispatchEvent).toHaveBeenCalledOnce());
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent<{ total: number }>;
    expect(event.type).toBe(COUNTER_UPDATED_EVENT);
    expect(event.detail).toEqual({ total: 42 });
  });

  it("registers a pagehide listener to flush on unload", () => {
    const addEventListener = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { addEventListener });

    createCounterBatcher().recordPlay("lumiere");

    expect(addEventListener).toHaveBeenCalledWith("pagehide", expect.any(Function));
  });
});
