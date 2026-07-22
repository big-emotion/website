import type { Content, RichTextField } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PipelineBoard from "./index";

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

type ObserverCallback = (entries: Pick<IntersectionObserverEntry, "isIntersecting">[]) => void;

function stubIntersectionObserver() {
  const observe = vi.fn();
  const disconnect = vi.fn();
  let capturedCallback: ObserverCallback | null = null;

  const IntersectionObserverMock = vi.fn(function (this: object, callback: ObserverCallback) {
    capturedCallback = callback;
    return Object.assign(this, { observe, disconnect, unobserve: vi.fn(), takeRecords: () => [] });
  });

  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

  return {
    IntersectionObserverMock,
    observe,
    disconnect,
    triggerIntersection(isIntersecting: boolean) {
      capturedCallback?.([{ isIntersecting }]);
    },
  };
}

const CAPTION: RichTextField = [
  { type: "paragraph", text: "A card slides lane to lane until the PR is reviewed.", spans: [] },
] as unknown as RichTextField;

function buildSlice(): Content.PipelineBoardSlice {
  return {
    id: "pipeline-board-1",
    slice_type: "pipeline_board",
    slice_label: null,
    variation: "default",
    version: "initial",
    primary: {
      caption: CAPTION,
      card_label: "SWBE-191",
      chip_label: "Reviewed PR",
    },
    items: [{ lane_label: "To do" }, { lane_label: "In review" }, { lane_label: "Done" }],
  } as unknown as Content.PipelineBoardSlice;
}

function renderSlice(slice: Content.PipelineBoardSlice = buildSlice()) {
  return render(<PipelineBoard slice={slice} index={0} slices={[slice]} context={{}} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PipelineBoard — motion allowed", () => {
  beforeEach(() => {
    stubMotionPreference(false);
  });

  it("renders a labelled figure with the caption, the lanes, the card and the PR chip", () => {
    stubIntersectionObserver();
    renderSlice();

    expect(screen.getByText("A card slides lane to lane until the PR is reviewed.")).toBeInTheDocument();
    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("SWBE-191")).toBeInTheDocument();
    expect(screen.getByText("Reviewed PR")).toBeInTheDocument();
  });

  it("flips data-visible exactly once when the board scrolls into view, then disconnects", () => {
    const { observe, disconnect, triggerIntersection } = stubIntersectionObserver();
    renderSlice();

    const board = screen.getByTestId("pipeline-board");
    expect(observe).toHaveBeenCalledWith(board);
    expect(board.dataset.visible).toBeUndefined();

    triggerIntersection(true);

    expect(board.dataset.visible).toBe("true");
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("ignores an out-of-view callback", () => {
    const { triggerIntersection } = stubIntersectionObserver();
    renderSlice();

    const board = screen.getByTestId("pipeline-board");
    triggerIntersection(false);

    expect(board.dataset.visible).toBeUndefined();
  });
});

describe("PipelineBoard — prefers-reduced-motion", () => {
  beforeEach(() => {
    stubMotionPreference(true);
  });

  // SWBE-201: reduced-motion visitors get the mechanism's final state (card in the
  // last lane, chip visible) straight from CSS, with no scroll-triggered animation.
  // Here we assert the JS half of that contract: no observer is ever attached, so
  // nothing depends on scroll timing to reach the readable content.
  it("never attaches an IntersectionObserver", () => {
    const { IntersectionObserverMock } = stubIntersectionObserver();
    renderSlice();

    expect(IntersectionObserverMock).not.toHaveBeenCalled();
  });

  it("still renders every label so the final state has content to show", () => {
    stubIntersectionObserver();
    renderSlice();

    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("SWBE-191")).toBeInTheDocument();
    expect(screen.getByText("Reviewed PR")).toBeInTheDocument();
  });
});

// No PipelineBoard label lands in a font-display slot (unlike ArticleHeader's title/kind),
// so the ASCII cmap constraint (DEC-023) does not apply here — nothing to guard.
