import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardPreview } from "./card-preview";

const { createCardPreview, preview } = vi.hoisted(() => {
  const preview = {
    activate: vi.fn(),
    deactivate: vi.fn(),
    track: vi.fn(),
    dispose: vi.fn(),
  };
  return { createCardPreview: vi.fn(async () => preview), preview };
});

vi.mock("./preview/runtime", () => ({ createCardPreview }));

function stubHoverCapability(hover: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("hover") ? hover : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  stubHoverCapability(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CardPreview", () => {
  // The gallery's whole budget rests on this: three.js, the Draco decoder and the GLB
  // are only fetched once a visitor asks to see a preview (DEC-030's spirit, now that
  // the gallery does mount 3D at all).
  it("loads nothing until the card is actually hovered", () => {
    render(
      <CardPreview motion="orient" active={false}>
        <span>vignette</span>
      </CardPreview>,
    );

    expect(createCardPreview).not.toHaveBeenCalled();
    expect(screen.getByText("vignette")).toBeInTheDocument();
  });

  it("builds the preview and plays it on the first hover", async () => {
    const { rerender } = render(
      <CardPreview motion="drop" active={false}>
        <span>vignette</span>
      </CardPreview>,
    );

    rerender(
      <CardPreview motion="drop" active>
        <span>vignette</span>
      </CardPreview>,
    );

    await waitFor(() => expect(preview.activate).toHaveBeenCalled());
    expect(createCardPreview).toHaveBeenCalledWith(expect.any(HTMLElement), "drop");
  });

  it("returns the mark to its rest pose when the pointer leaves", async () => {
    const { rerender } = render(
      <CardPreview motion="drop" active>
        <span>vignette</span>
      </CardPreview>,
    );
    await waitFor(() => expect(preview.activate).toHaveBeenCalled());

    rerender(
      <CardPreview motion="drop" active={false}>
        <span>vignette</span>
      </CardPreview>,
    );

    await waitFor(() => expect(preview.deactivate).toHaveBeenCalled());
  });

  it("reuses the preview it already built rather than rebuilding it each hover", async () => {
    const { rerender } = render(
      <CardPreview motion="orient" active>
        <span>vignette</span>
      </CardPreview>,
    );
    await waitFor(() => expect(preview.activate).toHaveBeenCalledTimes(1));

    rerender(
      <CardPreview motion="orient" active={false}>
        <span>vignette</span>
      </CardPreview>,
    );
    rerender(
      <CardPreview motion="orient" active>
        <span>vignette</span>
      </CardPreview>,
    );

    await waitFor(() => expect(preview.activate).toHaveBeenCalledTimes(2));
    expect(createCardPreview).toHaveBeenCalledTimes(1);
  });

  // A phone has no hover, so the card would otherwise pay for a WebGL context it can
  // never play — the typographic vignette is the whole card there.
  it("stays typographic where there is no hover to trigger it", async () => {
    stubHoverCapability(false);

    render(
      <CardPreview motion="orient" active>
        <span>vignette</span>
      </CardPreview>,
    );

    await Promise.resolve();
    expect(createCardPreview).not.toHaveBeenCalled();
  });

  it("releases the WebGL context when the card unmounts", async () => {
    const { unmount } = render(
      <CardPreview motion="orient" active>
        <span>vignette</span>
      </CardPreview>,
    );
    await waitFor(() => expect(preview.activate).toHaveBeenCalled());

    unmount();

    await waitFor(() => expect(preview.dispose).toHaveBeenCalled());
  });
});
