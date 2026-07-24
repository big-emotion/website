import { describe, expect, it } from "vitest";
import { STATES } from "@/components/scene/states";

import { SEED_COPY, toDocument } from "./seed-home.mjs";

const LOCALES = Object.keys(SEED_COPY);

describe("seed copy", () => {
  // The coupling risk called out in AGENTS.md: `home_scene` slices render in
  // `<SliceZone>` source order, and `ScenePanel` positions each beat by reading
  // `STATES[index]`. A reordered or resized seed would silently mispaint the scroll.
  it.each(LOCALES)("runs the %s beats in the exact STATES order and count", (lang) => {
    expect(SEED_COPY[lang].map((scene) => scene.sceneId)).toEqual(STATES.map((s) => s.name));
  });

  it("uses the introHero variation for intro and default for every other beat", () => {
    for (const lang of LOCALES) {
      for (const scene of SEED_COPY[lang]) {
        expect(scene.variation).toBe(scene.sceneId === "intro" ? "introHero" : "default");
      }
    }
  });

  it("shows the social handle on exactly the final beat", () => {
    for (const lang of LOCALES) {
      const withHandle = SEED_COPY[lang].filter((scene) => scene.socialHandle);
      expect(withHandle.map((scene) => scene.sceneId)).toEqual(["final"]);
    }
  });

  it.each(LOCALES)("keeps %s headline lines free of accented characters", (lang) => {
    // BBH Hegarty has an ASCII-only cmap (DEC-023) and headings land in font-display
    // slots. Prismic itself cannot enforce this, so at least the seeds comply.
    for (const scene of SEED_COPY[lang]) {
      for (const line of scene.heading ?? []) {
        expect(line).not.toMatch(/[À-ſ]/);
      }
    }
  });

  it("leaves the intro body correctly accented, since it is prose, not display type", () => {
    const intro = SEED_COPY["fr-fr"].find((scene) => scene.sceneId === "intro");
    expect(intro?.body).toContain("créatif");
  });
});

describe("toDocument", () => {
  it("shapes the seeded beats into a page the Migration API accepts", () => {
    const document = toDocument(SEED_COPY["fr-fr"], "fr-fr");

    expect(document).toMatchObject({ type: "page", uid: "home", lang: "fr-fr" });
    expect(document.data.slices).toHaveLength(6);
    expect(document.data.slices[0]).toMatchObject({
      slice_type: "home_scene",
      variation: "introHero",
    });
  });

  it("carries the heading lines as a Group of one line per item", () => {
    const document = toDocument(SEED_COPY["fr-fr"], "fr-fr");
    const approach = document.data.slices.find((slice) => slice.primary.scene_id === "approach");

    expect(approach.primary.heading).toEqual([
      { line: "L'agence" },
      { line: "qui fait" },
      { line: "dire wow" },
    ]);
  });

  it("flags the social handle only on the final beat", () => {
    const document = toDocument(SEED_COPY["en-us"], "en-us");
    const flagged = document.data.slices.filter((slice) => slice.primary.social_handle);

    expect(flagged).toHaveLength(1);
    expect(flagged[0].primary.scene_id).toBe("final");
  });
});
