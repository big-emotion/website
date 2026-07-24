import { describe, expect, it, vi } from "vitest";
import { resolveShareText, shareEffect } from "./share";

const payload = { url: "https://big-emotion.com/playground/mock/", title: "Mock effect" };

describe("shareEffect", () => {
  it("prefers the native share sheet when it's available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });

    const result = await shareEffect(payload);

    expect(share).toHaveBeenCalledWith(payload);
    expect(result).toBe("shared");
    vi.unstubAllGlobals();
  });

  it("reports a cancelled share as cancelled, not a failure", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });

    const result = await shareEffect(payload);

    expect(result).toBe("cancelled");
    vi.unstubAllGlobals();
  });

  it("falls back to the clipboard when the native share sheet is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await shareEffect(payload);

    expect(writeText).toHaveBeenCalledWith(payload.url);
    expect(result).toBe("copied");
    vi.unstubAllGlobals();
  });

  it("falls back to the clipboard when the native share sheet throws for a reason other than cancellation", async () => {
    const share = vi.fn().mockRejectedValue(new Error("not allowed"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    const result = await shareEffect(payload);

    expect(writeText).toHaveBeenCalledWith(payload.url);
    expect(result).toBe("copied");
    vi.unstubAllGlobals();
  });

  it("reports failure when neither the share sheet nor the clipboard is available", async () => {
    vi.stubGlobal("navigator", {});

    const result = await shareEffect(payload);

    expect(result).toBe("failed");
    vi.unstubAllGlobals();
  });

  it("reports failure when the clipboard write itself rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await shareEffect(payload);

    expect(result).toBe("failed");
    vi.unstubAllGlobals();
  });
});

describe("resolveShareText", () => {
  it("brags with the unlocked-badge text once the challenge is unlocked", () => {
    expect(resolveShareText("I just unlocked PLEIN SOLEIL!", true)).toBe(
      "I just unlocked PLEIN SOLEIL!",
    );
  });

  it("stays plain (no text override) while the challenge is still locked", () => {
    expect(resolveShareText("I just unlocked PLEIN SOLEIL!", false)).toBeUndefined();
  });

  it("stays plain when there is no unlocked-share text to switch to", () => {
    expect(resolveShareText(undefined, true)).toBeUndefined();
  });
});
