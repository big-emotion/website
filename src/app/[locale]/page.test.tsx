import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The real canvas boots three.js, GSAP and Lenis on mount — none of which jsdom can
// run, and none of which this page's contract depends on. Its own test file covers it.
vi.mock("@/components/scene/scene-canvas", () => ({
  SceneCanvas: () => <div data-testid="scene-canvas" />,
}));

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const Home = (await import("./page")).default;

async function renderHome(locale: "fr" | "en") {
  return render(await Home({ params: Promise.resolve({ locale }) }));
}

describe("Home", () => {
  it("lays out one full-viewport panel per scroll keyframe, in choreography order", async () => {
    const { container } = await renderHome("fr");
    const panels = container.querySelectorAll("[data-scene]");
    expect([...panels].map((panel) => panel.getAttribute("data-scene"))).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("names the page once, for screen readers, since the headline is the 3D wordmark", async () => {
    await renderHome("fr");
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("BIG EMOTION — L'agence B!G qui fait dire wow.");
  });

  it("renders each scene headline as a heading below the page title", async () => {
    await renderHome("fr");
    expect(
      screen.getByRole("heading", { level: 2, name: /L'agence qui fait dire wow/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Votre marque, en plus fort/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /On ne fait pas des sites/i }),
    ).toBeInTheDocument();
  });

  it("serves the English copy on the English locale", async () => {
    await renderHome("en");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "BIG EMOTION — The B!G agency that gives a wow.",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /Your brand, but louder/i }),
    ).toBeInTheDocument();
  });

  it("opens with the studio pitch on the intro panel", async () => {
    const { container } = await renderHome("fr");
    expect(container.querySelector('[data-scene="0"]')).toHaveTextContent(
      /studio créatif digital first/i,
    );
  });

  it("closes on the handle without offering a link, the social URLs being unknown", async () => {
    const { container } = await renderHome("fr");
    expect(container.querySelector('[data-scene="5"]')).toHaveTextContent("@bigemotionagency");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("keeps every panel transparent so the fixed scene shows through", async () => {
    const { container } = await renderHome("fr");
    for (const panel of container.querySelectorAll("[data-scene]")) {
      expect(panel.className).not.toMatch(/\bbg-/);
    }
  });
});
