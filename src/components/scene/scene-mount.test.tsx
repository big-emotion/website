import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("./model-gate");
  vi.doUnmock("./scene-canvas");
  vi.resetModules();
});

describe("SceneMount", () => {
  it("renders the static wordmark and never mounts the 3D runtime when the gate is off", async () => {
    vi.doMock("./model-gate", () => ({ HAS_HERO_MODEL: false }));
    const sceneCanvasSpy = vi.fn(() => <div data-testid="scene-canvas" />);
    vi.doMock("./scene-canvas", () => ({ SceneCanvas: sceneCanvasSpy }));

    const { SceneMount } = await import("./scene-mount");
    render(<SceneMount />);

    expect(screen.getByTestId("scene-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("scene-canvas")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scene-loader")).not.toBeInTheDocument();
    expect(sceneCanvasSpy).not.toHaveBeenCalled();
  });

  it("dynamically mounts the 3D runtime when the gate is on", async () => {
    vi.doMock("./model-gate", () => ({ HAS_HERO_MODEL: true }));
    vi.doMock("./scene-canvas", () => ({
      SceneCanvas: () => <div data-testid="scene-canvas" />,
    }));

    const { SceneMount } = await import("./scene-mount");
    render(<SceneMount />);

    await waitFor(() => {
      expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("scene-fallback")).not.toBeInTheDocument();
  });
});
