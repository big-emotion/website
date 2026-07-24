export type PaletteToken = "lemon" | "tangerine" | "lyon" | "brutal" | "ink" | "paper";

export type BrandPairing = {
  /** Background of the whole page — hero, index, article body, header ink and footer. */
  surface: PaletteToken;
  /** Everything a reader reads: titles, body copy, meta lines. */
  ink: PaletteToken;
  /** Non-text furniture only — see the note on the 3:1 floor below. */
  accent: PaletteToken;
};

/**
 * The colour associations from the brand guidelines' "ASSOCIATIONS" board (v1.0, p.4),
 * as background/ink token pairs.
 *
 * The board holds eighteen lockups; the eight missing here are the ones a page cannot
 * use — lemon on brutal reads 1.26:1, lyon on tangerine 3.04:1. A wordmark carries a
 * ratio that a paragraph cannot, and every pairing below paints a whole page of running
 * text, so only the AA-passing subset survives. That is asserted against the real
 * palette in `brand-pairings.test.ts` rather than trusted from this comment.
 *
 * `accent` is the third token each pairing spends on furniture that is not text —
 * heading underlines, section rules, the thesis sticker's drop shadow. It is held to
 * WCAG 1.4.11's 3:1 non-text floor instead of 4.5:1, which is what lets paper/lyon keep
 * its tangerine (3.25:1) without ever putting a reader in front of unreadable copy.
 */
export const BRAND_PAIRINGS = {
  "lemon-ink": { surface: "lemon", ink: "ink", accent: "lyon" },
  "lemon-lyon": { surface: "lemon", ink: "lyon", accent: "ink" },
  "ink-lemon": { surface: "ink", ink: "lemon", accent: "tangerine" },
  "ink-tangerine": { surface: "ink", ink: "tangerine", accent: "lemon" },
  "ink-paper": { surface: "ink", ink: "paper", accent: "lemon" },
  "lyon-paper": { surface: "lyon", ink: "paper", accent: "lemon" },
  "lyon-lemon": { surface: "lyon", ink: "lemon", accent: "paper" },
  "tangerine-ink": { surface: "tangerine", ink: "ink", accent: "paper" },
  "paper-lyon": { surface: "paper", ink: "lyon", accent: "tangerine" },
  "brutal-lyon": { surface: "brutal", ink: "lyon", accent: "ink" },
} as const satisfies Record<string, BrandPairing>;

export type BrandPairingId = keyof typeof BRAND_PAIRINGS;

/**
 * The association `/blog` itself is painted in. It is fixed, not drawn: the index is the
 * blog's front door and has to look like the same place on every visit.
 *
 * The `:root` block in globals.css hardcodes this pairing as the default value of the
 * three custom properties, which is what lets the index ship as pure SSG with no script
 * at all — only an article ever overrides them.
 */
export const INDEX_PAIRING_ID: BrandPairingId = "lemon-lyon";

/** What an article draws from: every association except the one the index wears. */
export const ARTICLE_PAIRINGS: BrandPairing[] = Object.entries(BRAND_PAIRINGS)
  .filter(([id]) => id !== INDEX_PAIRING_ID)
  .map(([, pairing]) => pairing);

export function pickArticlePairing(): BrandPairing {
  return ARTICLE_PAIRINGS[Math.floor(Math.random() * ARTICLE_PAIRINGS.length)];
}

/**
 * Paints a pairing by overriding the three custom properties on `<html>`.
 *
 * The properties hold a `var(--color-*)` reference rather than a hex so the palette
 * stays the single source of truth for what "lemon" is (REQ-002).
 */
export function applyPairing(root: HTMLElement, { surface, ink, accent }: BrandPairing): void {
  root.style.setProperty("--blog-surface", `var(--color-${surface})`);
  root.style.setProperty("--blog-ink", `var(--color-${ink})`);
  root.style.setProperty("--blog-accent", `var(--color-${accent})`);
}

/** Hands the page back to the `:root` defaults — the index's own association. */
export function clearPairing(root: HTMLElement): void {
  root.style.removeProperty("--blog-surface");
  root.style.removeProperty("--blog-ink");
  root.style.removeProperty("--blog-accent");
}

/**
 * The draw, again, as a string that runs while the HTML is still parsing.
 *
 * It cannot call `applyPairing`: a React effect only runs once the document has been
 * parsed and painted, so on a direct hit the reader would see the index's colours flip
 * to the article's a moment later. This lands the choice before the first paint;
 * `ArticlePairing` takes over for client-side navigations, which never re-parse a
 * document and so never reach this script.
 *
 * The interpolated values are token names from `PaletteToken`, never anything authored,
 * so there is nothing here that could close the script tag.
 */
export const ARTICLE_PAIRING_BOOTSTRAP = `(function(){var a=${JSON.stringify(
  ARTICLE_PAIRINGS.map(({ surface, ink, accent }) => [surface, ink, accent]),
)},p=a[Math.floor(Math.random()*a.length)],s=document.documentElement.style;s.setProperty("--blog-surface","var(--color-"+p[0]+")");s.setProperty("--blog-ink","var(--color-"+p[1]+")");s.setProperty("--blog-accent","var(--color-"+p[2]+")")})()`;
