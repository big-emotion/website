import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ARTICLE_PAIRINGS,
  BRAND_PAIRINGS,
  INDEX_PAIRING_ID,
  applyPairing,
  clearPairing,
  pickArticlePairing,
  type PaletteToken,
} from "./brand-pairings";

// The pairings name palette tokens; the hex behind each token lives in globals.css.
// Reading it back rather than restating it here is what makes the ratios below true of
// what actually ships — and REQ-002 keeps brand hexes out of the source anyway.
const GLOBALS_CSS = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

const PALETTE = Object.fromEntries(
  [...GLOBALS_CSS.matchAll(/--color-([a-z]+):\s*(#[0-9a-f]{6})/gi)].map(([, token, hex]) => [
    token,
    hex,
  ]),
) as Record<PaletteToken, string>;

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 §1.4.3 contrast ratio between two palette tokens. */
function contrast(one: PaletteToken, other: PaletteToken): number {
  const [lighter, darker] = [PALETTE[one], PALETTE[other]]
    .map(relativeLuminance)
    .sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("brand pairings", () => {
  it("names only tokens the palette actually defines", () => {
    for (const { surface, ink, accent } of Object.values(BRAND_PAIRINGS)) {
      expect(PALETTE).toHaveProperty(surface);
      expect(PALETTE).toHaveProperty(ink);
      expect(PALETTE).toHaveProperty(accent);
    }
  });

  // The board's other eight lockups (lemon on brutal, lyon on tangerine…) are excluded
  // upstream precisely because they fail here: a wordmark tolerates a ratio a paragraph
  // does not, and every pairing in this list paints a whole page of running text.
  it("keeps every association above the 4.5:1 floor for body copy", () => {
    const tooFaint = Object.entries(BRAND_PAIRINGS)
      .map(([id, { surface, ink }]) => ({ id, ratio: Number(contrast(surface, ink).toFixed(2)) }))
      .filter(({ ratio }) => ratio < 4.5);

    expect(tooFaint).toEqual([]);
  });

  // Accents carry underlines, rules and the thesis sticker's shadow — never text — so
  // 1.4.11's non-text floor is the right bar. An accent that matched the ink would make
  // a heading link's underline vanish into the heading.
  it("keeps every accent above the 3:1 non-text floor and distinct from the ink", () => {
    const unusable = Object.entries(BRAND_PAIRINGS)
      .map(([id, { surface, ink, accent }]) => ({
        id,
        ratio: Number(contrast(surface, accent).toFixed(2)),
        clashesWithInk: accent === ink,
      }))
      .filter(({ ratio, clashesWithInk }) => ratio < 3 || clashesWithInk);

    expect(unusable).toEqual([]);
  });

  // The index ships with no script, so its association is whatever the `:root` block
  // hardcodes. That block is the one place the palette lives outside this module, and
  // nothing else would notice the two drifting apart.
  it("paints the index with the association the stylesheet defaults to", () => {
    const styledDefaults = Object.fromEntries(
      [...GLOBALS_CSS.matchAll(/--blog-(surface|ink|accent):\s*var\(--color-([a-z]+)\)/g)].map(
        ([, slot, token]) => [slot, token],
      ),
    );

    expect(styledDefaults).toEqual({ ...BRAND_PAIRINGS[INDEX_PAIRING_ID] });
  });

  it("never hands an article the association the index is already painted in", () => {
    expect(BRAND_PAIRINGS).toHaveProperty(INDEX_PAIRING_ID);
    expect(ARTICLE_PAIRINGS).not.toContain(BRAND_PAIRINGS[INDEX_PAIRING_ID]);
    expect(ARTICLE_PAIRINGS.length).toBe(Object.keys(BRAND_PAIRINGS).length - 1);
  });

  it("only ever draws from that pool, at both ends of the random range", () => {
    for (const roll of [0, 0.999999]) {
      vi.spyOn(Math, "random").mockReturnValue(roll);
      expect(ARTICLE_PAIRINGS).toContain(pickArticlePairing());
      vi.restoreAllMocks();
    }
  });
});

describe("applying a pairing", () => {
  it("paints the three slots as palette references and takes them back off", () => {
    const root = document.documentElement;

    applyPairing(root, { surface: "ink", ink: "tangerine", accent: "lemon" });

    expect(root.style.getPropertyValue("--blog-surface")).toBe("var(--color-ink)");
    expect(root.style.getPropertyValue("--blog-ink")).toBe("var(--color-tangerine)");
    expect(root.style.getPropertyValue("--blog-accent")).toBe("var(--color-lemon)");

    clearPairing(root);

    expect(root.style.getPropertyValue("--blog-surface")).toBe("");
    expect(root.style.getPropertyValue("--blog-ink")).toBe("");
    expect(root.style.getPropertyValue("--blog-accent")).toBe("");
  });
});
