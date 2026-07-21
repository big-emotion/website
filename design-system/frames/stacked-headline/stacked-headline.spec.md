# Frame: StackedHeadline

- **Component:** `src/components/stacked-headline.tsx`
- **Story:** `Typography/StackedHeadline` (`src/stories/stacked-headline.stories.tsx`)
- **Reference:** `stacked-headline.png` — `Default` variant, captured at 900×400.

## What it shows

A headline broken across fixed lines, each rendered as a `block`-display `<span>`
inside a single heading tag (`h1`/`h2` via the `as` prop). Used across the marketing
scenes and section-route heroes for the designer-authored line breaks.

## Invariants

- Lines are joined by a literal space between the `block` spans, not just adjacent
  markup — removing it collapses the accessible name into a run-on word (see the
  component's own comment for the concrete example).
- No `dangerouslySetInnerHTML` — line breaks come from data (`lines: readonly
  string[]`), not markup in the copy.
- Heading level (`h1` vs `h2`) is a prop, not hardcoded, so page outline stays
  correct wherever the component is reused.
