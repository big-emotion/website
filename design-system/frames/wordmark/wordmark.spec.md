# Frame: Wordmark

- **Component:** `src/components/wordmark.tsx`
- **Story:** `Brand/Wordmark` (`src/stories/wordmark.stories.tsx`)
- **Reference:** `wordmark.png` — `Stacked` variant, captured at 480×320.

## What it shows

Text rendering of the "B!G EMOTION" wordmark in `font-display` (BBH Hegarty),
uppercase, tight leading. Two variants: `stacked` (two lines, the default used in
the header) and inline (single line via `stacked={false}`).

## Invariants

- Uses the `font-display` utility class (`src/app/globals.css`) — never a raw
  `font-family` declaration.
- `aria-label="BIG EMOTION"` stays on the wrapping `<span>` regardless of variant,
  since the two visual lines are `aria-hidden`.
- No accented characters — `font-display` has an ASCII-only cmap (DEC-023).

## Known gap

This is the interim text rendering (see the component's own comment): the real
logo SVG from the brand kit can replace it without touching callers. When that
lands, re-capture this frame.
