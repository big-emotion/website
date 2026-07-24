import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHALLENGE_UNLOCKED_EVENT,
  getUnlockedChallenges,
  isChallengeUnlocked,
  unlockChallenge,
  type ChallengeUnlockedDetail,
} from "./challenges";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("unlockChallenge", () => {
  it("is unlocked for nobody before the first unlock", () => {
    expect(isChallengeUnlocked("lumiere")).toBe(false);
    expect(getUnlockedChallenges()).toEqual([]);
  });

  it("unlocks a challenge and reports it as newly unlocked", () => {
    const result = unlockChallenge("lumiere");

    expect(result).toBe(true);
    expect(isChallengeUnlocked("lumiere")).toBe(true);
    expect(getUnlockedChallenges()).toEqual(["lumiere"]);
  });

  it("is idempotent: unlocking an already-unlocked challenge again reports false", () => {
    unlockChallenge("lumiere");
    const second = unlockChallenge("lumiere");

    expect(second).toBe(false);
    expect(getUnlockedChallenges()).toEqual(["lumiere"]);
  });

  it("only dispatches the unlocked event on the first, newly-unlocking call", () => {
    const seen: ChallengeUnlockedDetail[] = [];
    const onUnlocked = (event: Event) => {
      seen.push((event as CustomEvent<ChallengeUnlockedDetail>).detail);
    };
    window.addEventListener(CHALLENGE_UNLOCKED_EVENT, onUnlocked);

    unlockChallenge("lumiere");
    unlockChallenge("lumiere");

    window.removeEventListener(CHALLENGE_UNLOCKED_EVENT, onUnlocked);
    expect(seen).toEqual([{ effectId: "lumiere" }]);
  });

  it("keeps challenges for different effects independent", () => {
    unlockChallenge("lumiere");

    expect(isChallengeUnlocked("poids-lourd")).toBe(false);
    expect(getUnlockedChallenges().sort()).toEqual(["lumiere"]);
  });

  it("persists across a simulated reload — a fresh read still sees the unlock", () => {
    unlockChallenge("big-bang");

    // Nothing here holds in-memory state; every call re-reads localStorage, so this
    // stands in for "a fresh page load after the unlock" without needing to reset modules.
    expect(isChallengeUnlocked("big-bang")).toBe(true);
    expect(getUnlockedChallenges()).toEqual(["big-bang"]);
  });

  it("treats corrupted storage as no unlocks rather than throwing", () => {
    window.localStorage.setItem("playground:unlocked-challenges", "{not json");

    expect(isChallengeUnlocked("lumiere")).toBe(false);
    expect(getUnlockedChallenges()).toEqual([]);
  });
});
