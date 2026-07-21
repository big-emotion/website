# Design system

The BIG EMOTION design-fidelity setup (SWBE-23), following the pattern already in
use on `sitewebgrandechancellerie`: a Storybook catalogue of the real components
plus this `design-system/` composition layer transcribing the brand charter.

## Layout

- **`charter/charter.md`** — the brand charter (colors, type, spacing) transcribed
  from `brand/big-emotion-brand-guidelines.pdf` into the tokens actually shipped in
  `src/app/globals.css`. Source of truth for "what a compliant BIG EMOTION surface
  looks like."
- **`frames/<part>/`** — one directory per catalogued UI part, each holding:
  - `<part>.spec.md` — what the part is, which invariants make it correct, and
    which story/component it maps to.
  - `<part>.png` — a reference screenshot captured from that part's Storybook
    story (see "Capturing a frame" below).

## Storybook

`.storybook/` catalogues the real components under `src/stories/**`, so a frame's
reference PNG is always captured from the actual rendered component, not a
separate mockup.

```bash
pnpm storybook          # dev server at http://localhost:6006
pnpm build-storybook     # static build -> storybook-static/ (gitignored)
```

`@storybook/addon-vitest` is configured (`vitest.storybook.config.ts`) so stories
can run as component tests in a real Playwright browser — deliberately **not**
wired into `pnpm test` (the CI gate), per this ticket's scope: the design-system
*shape*, not the full drift-gate battery chancellerie runs. Run it locally once
browsers are installed:

```bash
pnpm exec playwright install chromium
pnpm test:storybook
```

## Capturing a frame

1. Add or update the component's story under `src/stories/`.
2. `pnpm build-storybook`, serve `storybook-static/`, and screenshot the story's
   `iframe.html?id=<story-id>&viewMode=story` at a deliberate viewport size.
3. Save the PNG as `design-system/frames/<part>/<part>.png` and write or update
   `<part>.spec.md` next to it.

## The frame-coupling rule

`design-system/frames/` existing at the repo root is what arms the frame-coupling
rule in `/bigemotion-ticket` (see `.claude/skills/bigemotion-ticket/SKILL.md`):
once a `<part>.spec.md` exists for a UI part, that spec — not the Jira ticket
text — becomes the source of truth for that part's design on any future conflict.

## Out of scope (this ticket)

- Chromatic account / visual-regression baseline — owner decision, not made yet.
- Figma integration — no Figma file exists for this project.
- Porting chancellerie's full drift-gate script battery — only the shape above.
