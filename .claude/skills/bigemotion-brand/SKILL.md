---
name: bigemotion-brand
description: The BIG EMOTION brand charter as working rules — palette and tokens, the three BBH widths and the ASCII display trap, logo clear space and the deform-the-type-not-the-logo rule, photo direction, tone of voice, and the website art direction. Use before writing or reviewing any user-facing surface, copy, colour, type choice or photo brief on the BIG EMOTION site, when the user says "is this on brand", "check the brand guidelines", "what colour/font should this be", or invokes /bigemotion-brand.
metadata:
  author: jnk
  version: "1.0.0"
---

# BIG EMOTION brand

The charter lives in the repo, in three layers. **Read `brand/BRAND.md` first** — it is the
transcription of the designer's PDF and the thing this skill exists to point you at.

| Layer | Path |
| --- | --- |
| Designer's PDF (authority) | `brand/big-emotion-brand-guidelines.pdf` |
| The 15 pages as images | `brand/pages/NN-topic.jpg` |
| The rules in text | `brand/BRAND.md` |

## When to activate

- Writing or reviewing anything a visitor sees: a section, a component, marketing copy.
- Choosing a colour, a typeface, a font weight, a photo, a headline.
- Briefing or generating imagery (`brand/BRAND.md` §4 carries the charter's own prompt).
- Reviewing a pull request that touches `src/components/`, `src/content/site.ts`,
  `src/app/globals.css`, or any Prismic display-slot copy.
- The user asks "is this on brand" or invokes `/bigemotion-brand`.

## How to use it

1. Read `brand/BRAND.md`. It is one file and it is the point of this skill.
2. For anything visual, **also look at the relevant page image** — the charter is a design
   document and the images carry things prose cannot. `brand/pages/` is named by topic
   (`03-palette`, `05-typography`, `13-website-art-direction`, …).
3. Apply the rules. Then run the four gates that can actually fail:

```bash
pnpm vitest run src/app/globals.css.test.ts     # palette matches the charter
pnpm vitest run src/content/site.test.ts        # display-slot ASCII rule + locale parity
pnpm vitest run src/content/tutoiement.test.tsx # French copy addresses the reader as tu
pnpm vitest run src/app/fonts/fonts.test.ts     # the three BBH width cuts are on disk
```

## The six that get broken most

Everything is in `BRAND.md`; these are the ones worth carrying in your head.

1. **Never a raw hex in a component.** Six tokens, declared in `src/app/globals.css`, and no
   seventh colour. `bg-lemon`, `text-ink`, `bg-tangerine`, `bg-lyon`, `bg-brutal`, `bg-paper`.
2. **Display copy is ASCII-only.** All three BBH cuts share the same 121-glyph
   ASCII-only cmap, so an accent in a `font-display` slot silently falls back to another
   face. Write "Defiler", not "Défiler". The test guards `site.ts`; it **cannot** guard
   Prismic — an editor typing "Médias" breaks it at runtime with nothing failing first.
3. **Use the three widths.** `font-display-condensed` (Bogle) and `font-display-extended`
   (Bartle) are modifiers inside a `.font-display` block — mixing them in one headline is
   the charter's signature, not decoration.
4. **Type deforms, the logo never does.** Stretching a headline to fill its format is the
   signature. Stretching the lockup is a mistake. Clear space = the height of the `!`; no
   shadow, no outline, no effect.
5. **Only the sanctioned colour pairings** (`BRAND.md` §1). Black on blue and blue on black
   are not among them, however tempting.
6. **Photos are contrasted, saturated, off-kilter and in motion.** Forbidden: neutral white
   background, flat lighting, desaturated colour, tame lifestyle calm, pastel.

## Tone

Short sentences, action verbs, **tutoiement**, cash not corporate, humour allowed and
jargon banned. Make them feel before you make them understand. The ten approved lines are
in `BRAND.md` §5 — reuse one rather than inventing a new claim.

The tutoiement is gated by a test for copy in the repo — but like the ASCII rule, **the
gate stops at Prismic**. The Home scroll spine and the articles are authored in the
dashboard, so a `vous` typed there ships with nothing failing first.

## Do not

- Do not edit `brand/big-emotion-brand-guidelines.pdf` or `brand/pages/`. They are the
  designer's document; a new charter version replaces them wholesale.
- Do not "fix" `BRAND.md` to match the code. It transcribes the charter. When they
  disagree, the code is what is wrong — or it is a deliberate divergence, in which case add
  it to the divergences table at the bottom of `BRAND.md` with the reason.
