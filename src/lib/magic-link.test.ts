import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consumeMagicLinkToken, mintMagicLinkToken } from "./magic-link";

// contact@big-emotion.com is the only seeded email in src/config/clients.ts.
const KNOWN_EMAIL = "contact@big-emotion.com";

describe("magic-link tokens", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mints a token for a provisioned email", () => {
    const token = mintMagicLinkToken(KNOWN_EMAIL);
    expect(token).toEqual(expect.any(String));
    expect(token!.length).toBeGreaterThan(20);
  });

  it("returns null for an unknown/unprovisioned email", () => {
    expect(mintMagicLinkToken("nobody@example.com")).toBeNull();
  });

  it("consumes a valid token exactly once, resolving {userId, clientId}", () => {
    const token = mintMagicLinkToken(KNOWN_EMAIL)!;
    expect(consumeMagicLinkToken(token)).toEqual({
      userId: KNOWN_EMAIL,
      clientId: "chancellerie",
    });
    // second verify of the same token must fail (single-use)
    expect(consumeMagicLinkToken(token)).toBeNull();
  });

  it("rejects an unknown token", () => {
    expect(consumeMagicLinkToken("this-token-does-not-exist")).toBeNull();
  });

  it("rejects a token older than the 15-minute TTL", () => {
    const token = mintMagicLinkToken(KNOWN_EMAIL)!;
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(consumeMagicLinkToken(token)).toBeNull();
  });

  it("accepts a token right at the edge of the TTL window", () => {
    const token = mintMagicLinkToken(KNOWN_EMAIL)!;
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(consumeMagicLinkToken(token)).not.toBeNull();
  });
});
