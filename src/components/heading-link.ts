/**
 * The look of a heading that is also a link — case study titles, article titles.
 *
 * These headings are the only way into the page behind them, and they used to carry
 * `hover:underline` alone: lemon display type on a coloured field, indistinguishable
 * from the non-clickable headings around them until a pointer happened to land on one.
 * On a touch screen there is no hover at all, so the affordance never appeared. The
 * links were reported as missing, which was a fair reading of the screen.
 *
 * The underline is therefore permanent and only thickens on interaction. It is sized in
 * `em` rather than pixels so it tracks each heading's own `clamp()` instead of thinning
 * to a hairline at 4rem and overwhelming the type at 1.4rem.
 */
export const HEADING_LINK =
  "underline decoration-[0.05em] underline-offset-[0.12em] hover:decoration-[0.1em]";
