import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.doUnmock("./model-gate");
  vi.doUnmock("./scene-canvas");
  vi.restoreAllMocks();
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
    expect(screen.queryByTestId("scene-intro-veil")).not.toBeInTheDocument();
    expect(sceneCanvasSpy).not.toHaveBeenCalled();
  });

  it("keeps a home-only veil above the page until the 3D reveal completes", async () => {
    vi.doMock("./model-gate", () => ({ HAS_HERO_MODEL: true }));
    vi.doMock("./scene-canvas", () => ({
      SceneCanvas: ({
        introActive,
        onIntroComplete,
      }: {
        introActive: boolean;
        onIntroComplete: () => void;
      }) => (
        <button
          type="button"
          data-testid="scene-canvas"
          data-intro-active={introActive}
          onClick={onIntroComplete}
        />
      ),
    }));

    const { SceneMount } = await import("./scene-mount");
    render(<SceneMount />);

    await waitFor(() => {
      expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
    });
    expect(screen.getByTestId("scene-intro-veil")).toHaveClass("z-[100]", "bg-lemon");
    expect(screen.getByTestId("scene-canvas")).toHaveAttribute("data-intro-active", "true");
    expect(screen.queryByTestId("scene-fallback")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("scene-canvas"));

    expect(screen.queryByTestId("scene-intro-veil")).not.toBeInTheDocument();
    expect(screen.getByTestId("scene-canvas")).toHaveAttribute("data-intro-active", "false");
  });

  it("resets and locks home scrolling only while the intro is active", async () => {
    vi.doMock("./model-gate", () => ({ HAS_HERO_MODEL: true }));
    vi.doMock("./scene-canvas", () => ({
      SceneCanvas: ({ onIntroComplete }: { onIntroComplete: () => void }) => (
        <button type="button" data-testid="scene-canvas" onClick={onIntroComplete} />
      ),
    }));
    const scrollTo = vi.mocked(window.scrollTo);
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      value: "auto",
      writable: true,
    });

    const { SceneMount } = await import("./scene-mount");
    const { unmount } = render(<SceneMount />);

    await waitFor(() => {
      expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
    });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(window.history.scrollRestoration).toBe("manual");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByTestId("scene-canvas"));

    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
    expect(window.history.scrollRestoration).toBe("manual");

    unmount();
    expect(window.history.scrollRestoration).toBe("auto");
  });
});
