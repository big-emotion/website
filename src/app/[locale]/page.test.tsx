import type { Content } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STATES } from "@/components/scene/states";

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

// `notFound()` throws in Next; the stub keeps that contract so the tests can assert the
// route bails instead of rendering a half-empty Home.
const notFoundError = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw notFoundError;
  },
}));

const { getByUID } = vi.hoisted(() => ({ getByUID: vi.fn() }));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getByUID }),
}));

const { default: Home } = await import("./page");

// One `home_scene` slice per `STATES` keyframe, in choreography order — the same
// contract the seeded copy in `scripts/seed-home.mjs` fulfils in production.
function homePage(lang: "fr-fr" | "en-us"): Content.PageDocument {
  const copy =
    lang === "fr-fr"
      ? {
          tagline: "L'agence B!G qui fait dire wow.",
          introBody:
            "Big Emotion est un studio créatif digital first qui façonne des marques que l’on ressent avant même de les comprendre.",
          approach: ["L'agence", "qui fait", "dire wow"],
          louder: ["Votre marque,", "en plus fort"],
          final: ["On ne fait pas", "des sites,", "on cree de l'impact."],
        }
      : {
          tagline: "The B!G agency that gives a wow.",
          introBody:
            "Big Emotion is a digital first creative studio building brands that people feel before they understand.",
          approach: ["The agency", "that gives", "a wow"],
          louder: ["Your brand,", "but louder"],
          final: ["We don't make", "websites,", "we create impact."],
        };

  const scene = (
    sceneId: string,
    variation: "default" | "introHero",
    primary: Record<string, unknown>,
  ) => ({ slice_type: "home_scene", slice_label: null, variation, primary: { scene_id: sceneId, ...primary }, items: [] });

  return {
    id: "home",
    uid: "home",
    data: {
      meta_title: "",
      meta_description: "",
      slices: [
        scene("intro", "introHero", { tagline: copy.tagline, body: copy.introBody }),
        scene("approach", "default", {
          heading: copy.approach.map((line) => ({ line })),
          body: "",
          social_handle: false,
        }),
        scene("cases", "default", {
          heading: [{ line: "Derriere" }],
          body: "",
          social_handle: false,
        }),
        scene("culture", "default", {
          heading: [{ line: "Digital first" }],
          body: "",
          social_handle: false,
        }),
        scene("louder", "default", {
          heading: copy.louder.map((line) => ({ line })),
          body: "",
          social_handle: false,
        }),
        scene("final", "default", {
          heading: copy.final.map((line) => ({ line })),
          body: "",
          social_handle: true,
        }),
      ],
    },
  } as unknown as Content.PageDocument;
}

async function renderHome(locale: "fr" | "en") {
  getByUID.mockResolvedValue(homePage(locale === "fr" ? "fr-fr" : "en-us"));
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

  it("sits the intro copy bottom-right, clear of the centred wordmark", async () => {
    const { container } = await renderHome("fr");
    const intro = container.querySelector('[data-scene="0"]');
    expect(intro?.className).toContain("items-end");
    expect(intro?.className).toContain("justify-end");
  });

  it("closes on the handle without offering a link, the social URLs being unknown", async () => {
    const { container } = await renderHome("fr");
    expect(container.querySelector('[data-scene="5"]')).toHaveTextContent("@bigemotionagency");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("stacks the closing beat like the reference: handle above the headline, socials below", async () => {
    const { container } = await renderHome("fr");
    const finalPanel = container.querySelector('[data-scene="5"]')!;
    const handle = [...finalPanel.querySelectorAll("p")].find(
      (p) => p.textContent === "@bigemotionagency",
    );
    const headline = finalPanel.querySelector("h2");
    expect(handle).toBeDefined();
    expect(headline).not.toBeNull();
    expect(
      handle!.compareDocumentPosition(headline!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Seven networks in one decorative sprite, deliberately unlinked (SWBE-95).
    const sprite = screen.getByRole("img", { name: /facebook, x, instagram/i });
    expect(finalPanel.contains(sprite)).toBe(true);
  });

  it("keeps every panel transparent so the fixed scene shows through", async () => {
    const { container } = await renderHome("fr");
    for (const panel of container.querySelectorAll("[data-scene]")) {
      expect(panel.className).not.toMatch(/\bbg-/);
    }
  });

  it("reads the home page in the locale of the route", async () => {
    await renderHome("en");
    expect(getByUID).toHaveBeenCalledWith("page", "home", { lang: "en-us" });
  });

  it("404s when the home page has no document in this locale", async () => {
    getByUID.mockRejectedValue(new Error("No documents were returned"));

    await expect(Home({ params: Promise.resolve({ locale: "en" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  // The coupling risk called out in AGENTS.md: a slice's rendering position is also its
  // `ScenePanel` index, so the fixture's scene order must itself match `STATES` for this
  // whole suite's assumptions to hold — this guards the fixture the way
  // `scripts/seed-home.test.mjs` guards the real seed.
  it("fixture scenes are declared in the exact STATES order and count", async () => {
    const page = homePage("fr-fr");
    const sceneIds = page.data.slices.map(
      (slice) => (slice as { primary: { scene_id: string } }).primary.scene_id,
    );
    expect(sceneIds).toEqual(STATES.map((state) => state.name));
  });
});
