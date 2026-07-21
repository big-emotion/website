import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubpagePhoto } from "./subpage-photo";

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

// The tilt reads the box geometry, which jsdom reports as all-zero — so it is stubbed
// to a known 400x300 box whose centre is (200, 150).
function stubBoxGeometry(element: Element) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 400,
    height: 300,
    right: 400,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => "",
  });
}

function frame() {
  return screen.getByTestId("subpage-photo-frame");
}

function media() {
  return screen.getByTestId("subpage-photo-media");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SubpagePhoto — motion allowed", () => {
  beforeEach(() => {
    stubMotionPreference(false);
  });

  it("tilts away from the pointer, within the designer's rotation range", () => {
    render(<SubpagePhoto page="approach" />);
    stubBoxGeometry(frame());

    // Bottom-right corner of the box: px = +0.5, py = +0.5.
    fireEvent.pointerMove(frame(), { clientX: 400, clientY: 300 });

    expect(media().style.getPropertyValue("--subpage-photo-ry")).toBe("8deg");
    expect(media().style.getPropertyValue("--subpage-photo-rx")).toBe("-6deg");
  });

  it("returns to rest when the pointer leaves", () => {
    render(<SubpagePhoto page="approach" />);
    stubBoxGeometry(frame());

    fireEvent.pointerMove(frame(), { clientX: 400, clientY: 300 });
    fireEvent.pointerLeave(frame());

    expect(media().style.getPropertyValue("--subpage-photo-ry")).toBe("0deg");
    expect(media().style.getPropertyValue("--subpage-photo-rx")).toBe("0deg");
  });

  it("parallaxes upward as the page scrolls", () => {
    render(<SubpagePhoto page="approach" />);

    window.scrollY = 500;
    fireEvent.scroll(window);

    expect(media().style.getPropertyValue("--subpage-photo-y")).toBe("-60px");
  });
});

describe("SubpagePhoto — prefers-reduced-motion", () => {
  beforeEach(() => {
    stubMotionPreference(true);
  });

  // REQ-008: every animation degrades to a static composition. The riseIn entrance
  // starts at opacity 0, so "inert" has to mean visible-and-untransformed, not just
  // "no listeners" — a half-applied opt-out would leave the hero invisible.
  it("ignores the pointer entirely", () => {
    render(<SubpagePhoto page="approach" />);
    stubBoxGeometry(frame());

    fireEvent.pointerMove(frame(), { clientX: 400, clientY: 300 });

    expect(media().style.getPropertyValue("--subpage-photo-ry")).toBe("");
    expect(media().style.getPropertyValue("--subpage-photo-rx")).toBe("");
  });

  it("ignores scrolling entirely", () => {
    render(<SubpagePhoto page="approach" />);

    window.scrollY = 500;
    fireEvent.scroll(window);

    expect(media().style.getPropertyValue("--subpage-photo-y")).toBe("");
  });

  it("drops the entrance animation class, so nothing is left at opacity 0", () => {
    render(<SubpagePhoto page="approach" />);

    expect(frame().className).not.toMatch(/subpage-rise/);
  });
});
