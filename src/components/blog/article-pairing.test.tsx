import { render } from "@testing-library/react";
import { ArticlePairing } from "./article-pairing";
import {
  ARTICLE_PAIRINGS,
  BRAND_PAIRINGS,
  applyPairing,
  clearPairing,
  type BrandPairing,
} from "./brand-pairings";

/** What `<html>` is currently painted in, read back the way a stylesheet would see it. */
function paintedPairing(): Partial<BrandPairing> {
  const token = (property: string) =>
    document.documentElement.style.getPropertyValue(property).replace(/^var\(--color-(.+)\)$/, "$1");

  return {
    surface: token("--blog-surface") as BrandPairing["surface"],
    ink: token("--blog-ink") as BrandPairing["ink"],
    accent: token("--blog-accent") as BrandPairing["accent"],
  };
}

describe("ArticlePairing", () => {
  afterEach(() => clearPairing(document.documentElement));

  it("paints the page in one of the associations an article may wear", () => {
    render(<ArticlePairing uid="ferry-une-carte-jira-bouge" />);

    expect(ARTICLE_PAIRINGS).toContainEqual(paintedPairing());
  });

  it("keeps the association that was already applied before the first paint", () => {
    const alreadyDrawn = BRAND_PAIRINGS["ink-tangerine"];
    applyPairing(document.documentElement, alreadyDrawn);

    render(<ArticlePairing uid="ferry-une-carte-jira-bouge" />);

    expect(paintedPairing()).toEqual({ ...alreadyDrawn });
  });

  it("hands the page back to the index's association when the reader leaves", () => {
    const { unmount } = render(<ArticlePairing uid="ferry-une-carte-jira-bouge" />);

    unmount();

    expect(paintedPairing()).toEqual({ surface: "", ink: "", accent: "" });
  });

  it("draws again when the reader moves straight to another article", () => {
    const { rerender } = render(<ArticlePairing uid="first-article" />);
    const drawnByChance = { ...paintedPairing() };

    // Two articles could legitimately draw the same association, so this pins the
    // mechanism rather than the outcome: force the second draw and check it took.
    vi.spyOn(Math, "random").mockReturnValue(0);
    rerender(<ArticlePairing uid="second-article" />);
    vi.restoreAllMocks();

    expect(paintedPairing()).toEqual({ ...ARTICLE_PAIRINGS[0] });
    expect(ARTICLE_PAIRINGS).toContainEqual(drawnByChance);
  });
});
