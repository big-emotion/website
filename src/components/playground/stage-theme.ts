// The stage theme every effect shares: the visitor recolors the logo and the stage
// backdrop — the frame the toy plays in, never the page — from the charter's six
// colours. The background→mark pairing matrix is ported from the B2B espace's
// brand-colors (same charter, same owner) and governs FLAT marks: the ball, or a
// logo tinted in a flat-reading colour. The chrome default is the one extra: `paper`
// tints the metal white — the shipped studio look — and its reflections keep it
// legible on any backdrop, so it stays available everywhere.
//
// Hex values exist because a Three.js material cannot read a CSS custom property;
// stage-theme.test.ts pins them to globals.css so the palette cannot drift in one
// place only. DOM consumers use `stageColorToken` (the CSS variable) instead.

export const STAGE_COLORS = ["lemon", "tangerine", "lyon", "brutal", "ink", "paper"] as const;

export type StageColor = (typeof STAGE_COLORS)[number];

export const STAGE_COLOR_HEX = {
  lemon: "#e9fc55",
  tangerine: "#ff5200",
  lyon: "#0024cc",
  brutal: "#dbdbdb",
  ink: "#000000",
  paper: "#ffffff",
} as const satisfies Record<StageColor, string>;

export type StageTheme = { backdrop: StageColor; logo: StageColor };

/** What every stage ships as: white chrome over the gallery's concrete grey. */
export const DEFAULT_STAGE_THEME: StageTheme = { backdrop: "brutal", logo: "paper" };

const STAGE_PAIRINGS = [
  { backdrop: "lemon", mark: "ink" },
  { backdrop: "lemon", mark: "lyon" },
  { backdrop: "lemon", mark: "tangerine" },
  { backdrop: "lemon", mark: "brutal" },
  { backdrop: "ink", mark: "lemon" },
  { backdrop: "ink", mark: "tangerine" },
  { backdrop: "ink", mark: "paper" },
  { backdrop: "tangerine", mark: "ink" },
  { backdrop: "tangerine", mark: "lyon" },
  { backdrop: "tangerine", mark: "lemon" },
  { backdrop: "tangerine", mark: "brutal" },
  { backdrop: "lyon", mark: "paper" },
  { backdrop: "lyon", mark: "lemon" },
  { backdrop: "brutal", mark: "tangerine" },
  { backdrop: "brutal", mark: "lemon" },
  { backdrop: "brutal", mark: "lyon" },
  { backdrop: "paper", mark: "tangerine" },
  { backdrop: "paper", mark: "lyon" },
] as const satisfies ReadonlyArray<{ backdrop: StageColor; mark: StageColor }>;

function flatMarkColors(backdrop: StageColor): StageColor[] {
  return STAGE_PAIRINGS.filter((pairing) => pairing.backdrop === backdrop).map(({ mark }) => mark);
}

/** Logo choices for a backdrop: chrome (`paper`) always, flat charter pairings after. */
export function allowedLogoColors(backdrop: StageColor): StageColor[] {
  const flat = flatMarkColors(backdrop);
  return flat.includes("paper") ? flat : ["paper", ...flat];
}

/** Keeps a theme legal across a backdrop change: an off-matrix logo colour snaps to
 *  the new backdrop's first allowed one. */
export function withBackdrop(theme: StageTheme, backdrop: StageColor): StageTheme {
  const allowed = allowedLogoColors(backdrop);
  return { backdrop, logo: allowed.includes(theme.logo) ? theme.logo : allowed[0] };
}

/** The ball is a flat mark, so it follows the matrix strictly — first flat colour
 *  that isn't already the logo's, so the two never read as one object. */
export function stageBallColor(theme: StageTheme): StageColor {
  return flatMarkColors(theme.backdrop).find((color) => color !== theme.logo) ?? "ink";
}

export function stageColorToken(color: StageColor): string {
  return `var(--color-${color})`;
}
