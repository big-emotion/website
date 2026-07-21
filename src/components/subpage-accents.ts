export type SubpageId = "approach" | "cases" | "culture" | "contact";

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
export const SUBPAGE_ACCENTS: Record<SubpageId, Accent> = {
  approach: { surface: "bg-lemon text-ink", headerInk: "text-ink" },
  cases: { surface: "bg-tangerine text-ink", headerInk: "text-ink" },
  culture: { surface: "bg-lyon text-paper", headerInk: "text-paper" },
  contact: { surface: "bg-ink text-lemon", headerInk: "text-lemon" },
};

/**
 * Which accent hero, if any, the given pathname renders under.
 *
 * Expects the locale-free pathname that `@/i18n/navigation`'s `usePathname` returns, so
 * `/cases/` and `/en/cases/` resolve to the same page.
 */
export function subpageFromPathname(pathname: string): SubpageId | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && segment in SUBPAGE_ACCENTS ? (segment as SubpageId) : null;
}
