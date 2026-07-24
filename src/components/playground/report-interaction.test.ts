import { afterEach, describe, expect, it, vi } from "vitest";
import { PLAYGROUND_INTERACTION_EVENT, reportInteraction } from "./report-interaction";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reportInteraction", () => {
  it("dispatches a window CustomEvent carrying the effect id and interaction", () => {
    const handler = vi.fn();
    window.addEventListener(PLAYGROUND_INTERACTION_EVENT, handler);

    reportInteraction("poids-lourd", "throw");

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ effectId: "poids-lourd", interaction: "throw" });

    window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, handler);
  });

  it("does not throw when called outside a browser environment", () => {
    const original = globalThis.window;
    // @ts-expect-error simulating an SSR call site
    delete globalThis.window;

    expect(() => reportInteraction("poids-lourd", "grab")).not.toThrow();

    globalThis.window = original;
  });
});
