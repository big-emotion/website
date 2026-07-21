import { describe, expect, it } from "vitest";

import { SEED_COPY, toDocument } from "./seed-case-studies.mjs";

const LOCALES = Object.keys(SEED_COPY);

// This parity guarantee used to live in src/content/site.test.ts, back when the sector
// cases were `site.ts` copy. It moves here with the content: the locale switcher
// preserves the path, so a uid present in one locale only would 404 on switch.
describe("seed copy", () => {
  it("exposes the same case study uids in every locale", () => {
    const uids = (lang) => SEED_COPY[lang].map((sector) => sector.uid);

    for (const lang of LOCALES) {
      expect(uids(lang)).toEqual(uids(LOCALES[0]));
    }
  });

  // The running order is a per-locale query result, so the two locales drifting apart
  // would silently reshuffle /cases against /en/cases.
  it("runs the studies in the same order in every locale", () => {
    const order = (lang) =>
      [...SEED_COPY[lang]].sort((a, b) => a.order - b.order).map((sector) => sector.uid);

    for (const lang of LOCALES) {
      expect(order(lang)).toEqual(order(LOCALES[0]));
    }
  });

  it.each(LOCALES)("gives every %s study a distinct display order", (lang) => {
    const orders = SEED_COPY[lang].map((sector) => sector.order);

    expect(new Set(orders).size).toBe(orders.length);
    expect(orders.every(Number.isInteger)).toBe(true);
  });

  it.each(LOCALES)("keeps %s display copy free of accented characters", (lang) => {
    // BBH Hegarty has an ASCII-only cmap (DEC-023) and these land in font-display
    // slots. Prismic itself cannot enforce this, so at least the seeds comply.
    for (const sector of SEED_COPY[lang]) {
      expect(sector.title).not.toMatch(/[À-ſ]/);
      expect(sector.kind).not.toMatch(/[À-ſ]/);
    }
  });
});

describe("toDocument", () => {
  it("shapes a sector into a case_study the Migration API accepts", () => {
    const document = toDocument(SEED_COPY["fr-fr"][0], "fr-fr");

    expect(document).toMatchObject({ type: "case_study", uid: "industrie", lang: "fr-fr" });
    expect(document.data.title).toBe("Industrie & B2B");
    expect(document.data.display_order).toBe(10);
    expect(document.data.summary[0]).toMatchObject({ type: "paragraph" });
    expect(document.data.tags).toEqual([
      { label: "Refonte" },
      { label: "Génération de leads" },
      { label: "SEO" },
    ]);
  });

  // An explicit null is rejected by the Migration API, so the field must be absent.
  it("omits the cover rather than sending an empty one", () => {
    expect(toDocument(SEED_COPY["en-us"][0], "en-us").data).not.toHaveProperty("cover");
  });

  it("leaves the client blank, since the engagements are under NDA", () => {
    for (const lang of LOCALES) {
      for (const sector of SEED_COPY[lang]) {
        expect(toDocument(sector, lang).data.client).toBe("");
      }
    }
  });
});
