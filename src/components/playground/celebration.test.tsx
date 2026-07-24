import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChallengeCelebration } from "./celebration";
import { unlockChallenge } from "./challenges";

function stubMotionPreference(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  window.localStorage.clear();
  stubMotionPreference(false);
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ChallengeCelebration", () => {
  it("renders nothing until this effect's challenge unlocks", () => {
    render(<ChallengeCelebration effectId="lumiere" message="Secret unlocked: PLEIN SOLEIL" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces the unlock message once the challenge unlocks", () => {
    render(<ChallengeCelebration effectId="lumiere" message="Secret unlocked: PLEIN SOLEIL" />);

    act(() => {
      unlockChallenge("lumiere");
    });

    expect(screen.getByRole("status")).toHaveTextContent("Secret unlocked: PLEIN SOLEIL");
  });

  it("ignores another effect's unlock", () => {
    render(<ChallengeCelebration effectId="lumiere" message="Secret unlocked: PLEIN SOLEIL" />);

    act(() => {
      unlockChallenge("poids-lourd");
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows confetti particles when motion is allowed", () => {
    render(<ChallengeCelebration effectId="lumiere" message="Secret unlocked: PLEIN SOLEIL" />);

    act(() => {
      unlockChallenge("lumiere");
    });

    expect(document.querySelectorAll(".challenge-confetti").length).toBeGreaterThan(0);
  });

  it("skips confetti under prefers-reduced-motion but still announces the message", () => {
    stubMotionPreference(true);
    render(<ChallengeCelebration effectId="lumiere" message="Secret unlocked: PLEIN SOLEIL" />);

    act(() => {
      unlockChallenge("lumiere");
    });

    expect(screen.getByRole("status")).toHaveTextContent("Secret unlocked: PLEIN SOLEIL");
    expect(document.querySelectorAll(".challenge-confetti").length).toBe(0);
  });
});
