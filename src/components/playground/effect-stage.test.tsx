import { render, screen, waitFor } from "@testing-library/react";
import { lazy } from "react";
import { describe, expect, it, vi } from "vitest";
import { EffectStage } from "./effect-stage";
import type { PlaygroundEffect } from "./effects";

function mockEffect() {
  const loader = vi.fn(() =>
    Promise.resolve({ default: () => <div data-testid="mock-effect">Loaded</div> }),
  );
  const effect: PlaygroundEffect = { id: "mock", slug: "mock", component: lazy(loader) };
  return { effect, loader };
}

describe("EffectStage", () => {
  it("shows the fallback before the effect chunk resolves", () => {
    const { effect } = mockEffect();
    render(<EffectStage effect={effect} fallback={<div data-testid="fallback" />} />);

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-effect")).not.toBeInTheDocument();
  });

  it("renders the effect once its lazy chunk resolves", async () => {
    const { effect } = mockEffect();
    render(<EffectStage effect={effect} fallback={<div data-testid="fallback" />} />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-effect")).toBeInTheDocument();
    });
  });

  it("only fetches the effect's chunk once the stage mounts, not at registration time", () => {
    const { effect, loader } = mockEffect();
    expect(loader).not.toHaveBeenCalled();

    render(<EffectStage effect={effect} fallback={<div data-testid="fallback" />} />);

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
