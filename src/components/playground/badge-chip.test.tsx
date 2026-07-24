import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BadgeChip } from "./badge-chip";
import { unlockChallenge } from "./challenges";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("BadgeChip", () => {
  it("stays absent while the effect's challenge is still a secret", () => {
    render(<BadgeChip effectId="lumiere" label="PLEIN SOLEIL" />);

    expect(screen.queryByText("PLEIN SOLEIL")).not.toBeInTheDocument();
  });

  it("shows the badge on mount when this browser already unlocked it", () => {
    unlockChallenge("lumiere");

    render(<BadgeChip effectId="lumiere" label="PLEIN SOLEIL" />);

    expect(screen.getByText("PLEIN SOLEIL")).toBeInTheDocument();
  });

  it("appears live when the challenge unlocks while the page is open", () => {
    render(<BadgeChip effectId="lumiere" label="PLEIN SOLEIL" />);

    expect(screen.queryByText("PLEIN SOLEIL")).not.toBeInTheDocument();

    act(() => {
      unlockChallenge("lumiere");
    });

    expect(screen.getByText("PLEIN SOLEIL")).toBeInTheDocument();
  });

  it("ignores another effect's unlock", () => {
    render(<BadgeChip effectId="lumiere" label="PLEIN SOLEIL" />);

    act(() => {
      unlockChallenge("poids-lourd");
    });

    expect(screen.queryByText("PLEIN SOLEIL")).not.toBeInTheDocument();
  });
});
