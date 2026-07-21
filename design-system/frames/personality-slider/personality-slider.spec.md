# Frame: PersonalitySlider

- **Component:** `src/components/personality-slider.tsx`
- **Story:** `Culture/PersonalitySlider` (`src/stories/personality-slider.stories.tsx`)
- **Reference:** `personality-slider.png` — `French` variant, captured at 900×700.

## What it shows

Six brand-personality axes (`personalityAxes` in `src/content/site.ts`) rendered as
a pole-to-pole line with a dot marking where the brand sits. Pure graphics carry no
semantic meaning on their own, so each axis is also a `role="group"` with an
`aria-label` stating the reading in words (e.g. "Formal to Casual: leans casual").

## Invariants

- Locale-driven copy (`useTranslations("culture")`) — the story wraps the
  component in `NextIntlClientProvider` with the real `messages/{fr,en}.json`,
  never inline strings, so the frame reflects the same translation keys the app
  ships.
- Six axes, always — `src/content/site.test.ts` already pins this count; a frame
  showing a different number is drift, not a design change.
- The dot position is a percentage (`axis.position`), not a hardcoded pixel/rem
  offset, so the layout stays responsive at the grid breakpoints in the component.

## Locales

Both `French` and `English` story variants exist; this frame captures French only.
Re-capture the `English` variant if the English copy or layout changes
independently of French.
