export type SubpageId = "approach" | "cases" | "culture" | "contact" | "playground" | "blog";

// Every accent route now opens on `SubpageHero`, so this is no longer a wider set than
// `SubpageId` — blog was the one entry that had a header ink but no hero of its own.
// The alias stays because the header and footer read accents by this name.
export type HeaderAccentId = SubpageId;

type Accent = {
  /** Background + ink for the hero band itself. */
  surface: string;
  /**
   * Ink for the fixed header while it sits over that band. The header is rendered by the
   * layout, above and outside the page, so it cannot inherit the hero's colour — it has
   * to be told. Without this, `/contact/`'s ink hero renders a black header on black.
   */
  headerInk: string;
};

// Token-mapped from the designer's prototype (`accent-yellow|orange|blue|black`).
// Tokens only: REQ-002 forbids a raw brand hex in a component.
export const SUBPAGE_ACCENTS: Record<HeaderAccentId, Accent> = {
  approach: { surface: "bg-lemon text-ink", headerInk: "text-ink" },
  cases: { surface: "bg-tangerine text-ink", headerInk: "text-ink" },
  culture: { surface: "bg-lyon text-paper", headerInk: "text-paper" },
  contact: { surface: "bg-ink text-lemon", headerInk: "text-lemon" },
  // Grey is the studio backdrop the chrome logo is lit against (the rig bakes its
  // environment on 0x565b64), so the Playground keeps brutal on the gallery *and* on
  // every effect stage — the chrome reads as chrome instead of as a flat silhouette.
  playground: { surface: "bg-brutal text-ink", headerInk: "text-ink" },
  // The one accent that is not a fixed pair of tokens. The blog wears a whole
  // association from the guidelines' board — its own on /blog, one drawn at random on
  // each article (src/components/blog/brand-pairings.ts) — so it names the custom
  // properties those two set instead. Reading them here is what carries the association
  // out to the header ink and the footer band, which sit outside the page and would
  // otherwise keep the index's colours over an article painted in another pair.
  blog: {
    surface: "bg-[var(--blog-surface)] text-[var(--blog-ink)]",
    headerInk: "text-[var(--blog-ink)]",
  },
};

/**
 * Which accent hero, if any, the given pathname renders under.
 *
 * Expects the locale-free pathname that `@/i18n/navigation`'s `usePathname` returns, so
 * `/cases/` and `/en/cases/` resolve to the same page.
 */
export function subpageFromPathname(pathname: string): HeaderAccentId | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && segment in SUBPAGE_ACCENTS ? (segment as HeaderAccentId) : null;
}
