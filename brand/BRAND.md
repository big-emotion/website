# BIG EMOTION — brand canon

The designer's charter, transcribed so it can be read, grepped and diffed. **This file is
a transcription, not an authority**: where it and the PDF disagree, the PDF wins and this
file is wrong and should be fixed.

| Layer | Where | What it is for |
| --- | --- | --- |
| Source | `brand/big-emotion-brand-guidelines.pdf` (v1.0, June 2026, 15 pages) | The designer's own document. Never edited here. |
| Visual reference | `brand/pages/NN-topic.jpg` | The same 15 pages, one image each, so a page can be looked at without opening a PDF. |
| Canon | this file | The rules in text: greppable, reviewable in a pull request. |
| Gate | `src/app/globals.css.test.ts`, `src/content/site.ts` + `site.test.ts` | The rules a test can actually enforce. A doc nobody reads protects nothing. |

Positioning, from the cover: **vraie identité + émotion brute** — *« Nous ne construisons
pas des marques. Nous créons les émotions qui les rendent inoubliables. »*

---

## 1. Colour — `03-palette.jpg`

Six colours, no others. Never write a hex in a component; use the token.

| Charter name | Hex | CSS token | Tailwind |
| --- | --- | --- | --- |
| Lemon Yellow (signature) | `#f2ff26` | `--color-lemon` | `bg-lemon` / `text-lemon` |
| Orange Tangerine | `#ff5200` | `--color-tangerine` | `bg-tangerine` / `text-tangerine` |
| Deep Lyon Blue | `#0024cc` | `--color-lyon` | `bg-lyon` / `text-lyon` |
| Brutal Grey | `#dbdbdb` | `--color-brutal` | `bg-brutal` / `text-brutal` |
| Black | `#000000` | `--color-ink` | `bg-ink` / `text-ink` |
| White | `#ffffff` | `--color-paper` | `bg-paper` / `text-paper` |

The tokens are declared in `src/app/globals.css` and asserted against this table by
`src/app/globals.css.test.ts`. Changing a value there fails the build until the charter
changes with it.

Lemon is the signature: it is what a viewer should remember, so it earns the hero surfaces
rather than being sprinkled as an accent.

### Allowed pairings — `04-color-pairings.jpg`

The charter fixes which mark colour goes on which ground. Eighteen combinations, and the
logo page is explicit that **no other association may be invented**:

| Ground | Mark may be |
| --- | --- |
| Lemon | Black · Blue · Tangerine · Grey |
| Black | Lemon · Tangerine · White |
| Tangerine | Black · Blue · Lemon · Grey |
| Blue | White · Lemon |
| Grey | Lemon · Tangerine · Blue |
| White | Tangerine · Blue |

Read off the page image; check it if a case looks marginal. Note what is *absent*: black
on blue, blue on black, grey on white — none of them clear the contrast the charter asks
for.

## 2. Typography — `05-typography.jpg`

**BBH** — display. A variable family in three widths, and using all three is the point:

| Cut | Width | Role |
| --- | --- | --- |
| BBH Bogle | condensed | titles, mixed with the others in one line |
| BBH Hegarty | regular | subtitles, and titles |
| BBH Bartle | extended | titles, mixed with the others in one line |

> *« La BBH est une police variable composée de 3 typos : une condensée, une regular et une
> etendue, 3 formes afin de faire jouer avec les messages & habillages graphiques, le style
> est le message ! »*

**Bricolage Grotesque** — body. Variable, libre and open source; French spirit with British
detailing across three axes (weight, width, optical size).

Both are on Google Fonts. This repo self-hosts them as woff2 under `src/app/fonts/` so
builds stay offline-reproducible and no visitor request reaches Google — see AGENTS.md.

### The accent trap (DEC-023)

The shipped BBH woff2 has an **ASCII-only cmap**. Any accented character in a
`font-display` slot silently falls back to another face and the line breaks visually.
So: **display copy is authored unaccented** — "Defiler", "Derriere chaque clic", "REFERENCES".
Body copy keeps its accents normally.

`src/content/site.test.ts` enforces this for everything in `site.ts`. It **cannot** reach
Prismic: a case-study title or `kind` typed as "Médias" in the dashboard will break at
runtime with nothing failing first. Author display-slot copy in Prismic unaccented.

## 3. Logo — `02-logo.jpg`

> *« Le logo est un bloc. On préserve sa zone de protection (= la hauteur du !) et on ne le
> déforme jamais. Ne pas utiliser d'autres associations de couleurs que celles proposées
> ici, ne pas étirer ni déformer sauf pour un habillage graphique, ne pas ajouter d'ombre,
> contour ou effet, ne pas poser un fond qui nuit au contraste. »*

- Clear space on every side = **the height of the `!`**.
- Never stretched, skewed or re-proportioned. The one exception is *habillage* — the mark
  blown up as a graphic device, cropped by the frame, still at its own proportions.
- No shadow, no outline, no effect, no gradient.
- Only the pairings in §1 above.
- Three placements are sanctioned: on clear space, on a colour field, over a photo.

**Typography deforms, the logo does not** (`10-in-situ-compositions.jpg`): stretching a
headline to fill its format is the signature; stretching the lockup is a mistake.

## 4. Photography and iconography — `06-iconography.jpg`

- Studio **or** natural setting — both belong.
- Contrasted, directional light. Pronounced light effects. Frank, saturated colour.
- Retouching is **visible and intentional**. AI generation or augmentation is accepted as
  long as the result still reads photographic.
- Framing is systematically bold: fisheye, extreme close-up, radical low angle, high angle,
  dutch tilt, off-centre subject, physically improbable angles. *Composition that
  destabilises before it seduces.*
- Surreal scenes. **Movement is central**: motion blur, frozen peak action, bodies
  suspended or at maximum tension.
- Real, undirected emotion: frank joy, physical euphoria, intensity, pure concentration.
  Marked expressions.

**Forbidden**: neutral white background, uniform light, desaturated colour, smooth
expressions, tame lifestyle aesthetics. Zero pastel, zero washed-out overexposure, zero
flat lighting.

The charter ships its own generation prompt, reproduced verbatim:

> [Dynamic athlete portrait], bold saturated colors, no pastel, no overexposure, natural
> golden hour light OR strong directional studio light, deep shadows, daring framing,
> fisheye lens, extreme low angle or dutch tilt, subject off-center, surreal or physically
> impossible scene, raw energy, intense or euphoric expression, motion blur or frozen peak
> action, vivid sky with dramatic clouds, cinematic color grading, hyper-real not
> hyperrealistic, editorial sports photography style, shot on Phase One, 4K, no white
> background, no flat lighting, no neutral expression

## 5. Tone of voice — `07-tone-of-voice.jpg`

> *« Tutoiement assumé, phrases courtes, verbes d'action. On parle cash, jamais corporate.
> L'humour est permis, le jargon interdit. Faire ressentir avant de faire comprendre.
> Transformer un message en émotion mémorable. »*

Values: **Audace · Sincérité · Énergie · Simplicité radicale · Exigence créative.**

The approved lines — reuse these rather than inventing a new claim:

- WE DON'T MAKE WEBSITES. WE MAKE IMPACT.
- DIGITAL IS THE MEDIUM. EMOTION IS THE MESSAGE.
- BIG IDEAS. BIGGER FEELINGS.
- DIGITAL FIRST. EMOTION ALWAYS.
- WE BUILD WHAT PEOPLE REMEMBER.
- WE TURN SCREENS INTO EXPERIENCES.
- BEHIND EVERY CLICK, A FEELING.
- THE WEB, REIMAGINED WITH FEELING.
- THE AGENCY THAT GIVES A DAMN.
- YOUR BRAND, BUT LOUDER.

Several already carry a section on the site (`sectionHeroes` in `src/content/site.ts`).

## 6. Brand personality — `08-personality-slider.jpg`

Six axes, each with a fixed position. `personalityAxes` in `src/content/site.ts` holds them
as percentages (0 = left label, 100 = right) and the Culture page renders them:

| Left | Right | Position |
| --- | --- | --- |
| Formal | Casual | 54 |
| Cold | Warm | 35 |
| Serious | Playful | 45 |
| Detailed | Minimal | 63 |
| Corporate | Friendly | 40 |
| Complex | Simple | 54 |

Read it as a brief: minimal and simple more than detailed, warm and friendly more than cold
and corporate, and only *just* on the playful side of serious — the work is playful, the
craft is not.

## 7. Website art direction — `13-website-art-direction.jpg`, `12-website-favicon-loader.jpg`

> *« Le website est en "full size" entre aplat de couleurs, blanc & photos, toujours mettre
> en avant la typo ainsi que les photos, l'animation sera un réel plus pour transitions en
> zoom et/ou parallaxe. Du contenu "straight to the point" et impactant tout en conservant
> un esprit minimaliste. »*

Which cashes out as:

- **Full-bleed sections.** A page alternates colour fields, white and photography. No
  boxed-in content column as the default rhythm.
- **Typography and photography carry the page.** Ornament does not.
- **Motion is zoom and parallax**, used at transitions. It is a bonus on top of a page that
  already works, never the thing holding it up.
- **Straight to the point.** Short copy, minimal spirit, high impact.
- A **looping logo animation as a load screen** introduces the site (page 12).
- Favicon: the `B!` block mark.

## 8. Social and formats — `09-social-media.jpg`, `14-formats-stationery.jpg`

> *« La typo BBH s'étire ou se condense pour remplir le support : on utilise les 3 largeurs
> possible avec la typo. La phrase s'etend ou se contracte à chaque format (story, feed,
> print). La déformation n'est pas un défaut, c'est la signature. Possible d'avoir le logo
> en petit ou en grand (non deformable). »*

Stationery covered by the charter: business card, document letterhead, mail signature, PPT
cover and back cover. Contact block as printed there: `contact@big-emotion.com` ·
`big-emotion.com` · `@big-emotion on socials` · `+33 7 03 676 43 22`.

---

## Known divergences between this charter and the shipped site

Recorded so they are decisions, not accidents. Fix, or arbitrate and note the arbitration.

| Charter | Site today | Note |
| --- | --- | --- |
| BBH in three widths, and the interplay is the signature (`05`, `09`) | only `bbh-hegarty` is self-hosted in `src/app/fonts/` | Bogle (condensed) and Bartle (extended) are missing, so no headline can mix widths. The single largest gap. |
| Tutoiement assumé (`07`) | mixed — `site.ts` has both "ton besoin" and "Revenez bientôt" | Pick one register and sweep. |
| `@big-emotion on socials` (`14`) | `socialHandle = "@bigemotion"` in `src/content/site.ts` | Open arbitration; the real handles need checking before either is treated as canon. |
| Looping logo load screen (`12`) | none | Weigh against LCP before building it. |

## Checking a change against this

- Colour tokens: `pnpm vitest run src/app/globals.css.test.ts`
- Display-slot copy (ASCII rule) and locale parity: `pnpm vitest run src/content/site.test.ts`
- Everything else is a judgement call — read the relevant page image, then §1–§8 above.
