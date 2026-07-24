import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { unlockChallenge } from "./challenges";
import { EffectHud } from "./hud";

const copy = {
  back: "Retour au Playground",
  share: {
    button: "Partager",
    sharedToast: "Merci du partage !",
    copiedToast: "Lien copié dans le presse-papiers.",
    failedToast: "Impossible de partager pour le moment.",
  },
};

const shareEffect = vi.fn();
vi.mock("./share", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./share")>()),
  shareEffect: (...args: unknown[]) => shareEffect(...args),
}));

function renderHud(
  children?: ReactNode,
  overrides: { effectId?: string; unlockedShareText?: string } = {},
) {
  return render(
    <EffectHud
      title="Mock effect"
      backHref="/playground"
      shareUrl="https://big-emotion.com/playground/mock/"
      copy={copy}
      effectId={overrides.effectId ?? "mock-effect"}
      unlockedShareText={overrides.unlockedShareText}
    >
      {children}
    </EffectHud>,
  );
}

describe("EffectHud", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("gives the effect the page's only h1", () => {
    renderHud();

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Mock effect");
  });

  it("links back to the gallery", () => {
    renderHud();

    expect(screen.getByRole("link", { name: copy.back })).toHaveAttribute("href", "/playground");
  });

  it("renders the badge and counter-chip slots when passed", () => {
    renderHud(
      <>
        <div data-testid="badge-slot">Badge</div>
        <div data-testid="counter-slot">42</div>
      </>,
    );

    expect(screen.getByTestId("badge-slot")).toBeInTheDocument();
    expect(screen.getByTestId("counter-slot")).toBeInTheDocument();
  });

  it("announces a successful share", async () => {
    shareEffect.mockResolvedValue("shared");
    renderHud();

    fireEvent.click(screen.getByRole("button", { name: copy.share.button }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(copy.share.sharedToast);
    });
  });

  it("announces a clipboard fallback", async () => {
    shareEffect.mockResolvedValue("copied");
    renderHud();

    fireEvent.click(screen.getByRole("button", { name: copy.share.button }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(copy.share.copiedToast);
    });
  });

  it("announces a failure", async () => {
    shareEffect.mockResolvedValue("failed");
    renderHud();

    fireEvent.click(screen.getByRole("button", { name: copy.share.button }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(copy.share.failedToast);
    });
  });

  it("stays silent when the native share sheet is simply dismissed", async () => {
    shareEffect.mockResolvedValue("cancelled");
    renderHud();

    fireEvent.click(screen.getByRole("button", { name: copy.share.button }));

    await waitFor(() => {
      expect(shareEffect).toHaveBeenCalled();
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("passes the effect's own url and title to the share logic", async () => {
    shareEffect.mockResolvedValue("shared");
    renderHud();

    fireEvent.click(screen.getByRole("button", { name: copy.share.button }));

    expect(shareEffect).toHaveBeenCalledWith({
      url: "https://big-emotion.com/playground/mock/",
      title: "Mock effect",
    });
  });

  it("brags with the unlocked-badge text once this effect's challenge is unlocked", async () => {
    shareEffect.mockResolvedValue("shared");
    unlockChallenge("mock-effect");

    renderHud(undefined, { effectId: "mock-effect", unlockedShareText: "I just unlocked PLEIN SOLEIL!" });
    fireEvent.click(screen.getByRole("button", { name: copy.share.button }));

    await waitFor(() => {
      expect(shareEffect).toHaveBeenCalledWith({
        url: "https://big-emotion.com/playground/mock/",
        title: "Mock effect",
        text: "I just unlocked PLEIN SOLEIL!",
      });
    });
  });
});
