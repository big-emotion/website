import { afterEach, describe, expect, it, vi } from "vitest";
import { countPlays } from "./count-plays";
import { reportInteraction } from "./report-interaction";

const recordPlay = vi.fn();

afterEach(() => {
  recordPlay.mockClear();
});

describe("countPlays", () => {
  // The bug this closes: the effects have always dispatched `playground:interaction`
  // and the batcher has always exposed `recordPlay`, but nothing joined the two — so
  // the collective counter could never leave zero, whatever a visitor did.
  it("records every interaction an effect reports", () => {
    const stop = countPlays({ recordPlay, flush: vi.fn() });

    reportInteraction("poids-lourd", "throw");
    reportInteraction("poids-lourd", "bounce");
    reportInteraction("lumiere", "spin");

    expect(recordPlay.mock.calls).toEqual([["poids-lourd"], ["poids-lourd"], ["lumiere"]]);
    stop();
  });

  it("stops counting once the effect page is left", () => {
    const stop = countPlays({ recordPlay, flush: vi.fn() });
    stop();

    reportInteraction("poids-lourd", "throw");

    expect(recordPlay).not.toHaveBeenCalled();
  });

  // Anything can dispatch on `window`; only a payload naming an effect is countable.
  it("ignores an event carrying no effect", () => {
    const stop = countPlays({ recordPlay, flush: vi.fn() });

    window.dispatchEvent(new CustomEvent("playground:interaction", { detail: {} }));
    window.dispatchEvent(new CustomEvent("playground:interaction"));

    expect(recordPlay).not.toHaveBeenCalled();
    stop();
  });
});
