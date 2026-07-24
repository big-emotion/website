import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia implementation. gsap's ScrollTrigger (used by the
// hero scene, see src/components/scene/scene-canvas.tsx) reads it as soon as
// the module registers, so every test needs a default — individual test files
// can still override it (e.g. to simulate prefers-reduced-motion) via
// vi.stubGlobal("matchMedia", ...).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom exposes scrollTo but reports every call as "not implemented". It has no layout
// to move anyway; tests that own scroll behavior spy on this seam and assert the request.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}
