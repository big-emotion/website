import { describe, expect, it } from "vitest";

import { accentedDisplayCopy } from "./prismic-check-display.mjs";

/** Minimal shape of what the Content API returns for an `article`. */
function article({ uid = "a", lang = "fr-fr", title = "Titre", headings = [] } = {}) {
  return {
    uid,
    lang,
    data: {
      title,
      body: headings.map((heading) => ({
        primary: {
          heading: heading === null ? [] : [{ type: "heading2", text: heading }],
          body: [{ type: "paragraph", text: "Corps accentué — exempté." }],
        },
      })),
    },
  };
}

describe("accentedDisplayCopy", () => {
  it("passes an article whose display slots are pure ASCII", () => {
    const doc = article({ title: "Le jugement ne se reproduit pas", headings: ["Un refuge qui mange sa fondation"] });
    expect(accentedDisplayCopy(doc)).toEqual([]);
  });

  it("flags an accented title", () => {
    const doc = article({ uid: "x", title: "Rendez-vous réussi" });
    expect(accentedDisplayCopy(doc)).toEqual([{ uid: "x", lang: "fr-fr", slot: "title", text: "Rendez-vous réussi" }]);
  });

  // The bug this script exists for: `.article-prose :where(h2, h3, h4)` resolves to
  // font-display, so a section heading is a display slot even though it lives in the
  // rich text. Reading the serializer alone suggests otherwise.
  it("flags an accented section heading", () => {
    const doc = article({ uid: "y", headings: ["Un refuge", "Je me suis arrêté trop tôt"] });
    expect(accentedDisplayCopy(doc)).toEqual([
      { uid: "y", lang: "fr-fr", slot: "body[1].heading", text: "Je me suis arrêté trop tôt" },
    ]);
  });

  it("reports every offending slot, not just the first", () => {
    const doc = article({ title: "Été", headings: ["Déjà", "Ok"] });
    expect(accentedDisplayCopy(doc).map((hit) => hit.slot)).toEqual(["title", "body[0].heading"]);
  });

  // Body copy keeps correct French — the guard protects the slots, not the module.
  it("ignores accented body prose", () => {
    const doc = article({ title: "Ok", headings: ["Ok"] });
    expect(accentedDisplayCopy(doc)).toEqual([]);
  });

  it("tolerates a section with no heading (the intro block)", () => {
    const doc = article({ headings: [null] });
    expect(accentedDisplayCopy(doc)).toEqual([]);
  });

  it("leaves an unaccented non-Latin mark alone", () => {
    // Em dashes and typographic quotes are outside the accented-letter range the
    // brand rule targets; site.test.ts draws the line the same way.
    const doc = article({ title: "Digital — the medium" });
    expect(accentedDisplayCopy(doc)).toEqual([]);
  });
});
