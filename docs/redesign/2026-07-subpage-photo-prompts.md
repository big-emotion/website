# Sub-page photography — generation prompts (SWBE-91)

The four prompts that produced the hero images of the four marketing sub-pages
(`approach`, `cases`, `culture`, `contact`), at 1536×2048 (3:4 portrait).

This resolves option 2 of [`2026-07-photo-sourcing-findings.md`](./2026-07-photo-sourcing-findings.md) §6:
the designer's four prototype JPEGs could not ship (two carry visible third-party trademarks — adidas,
AITO/Huawei — and all four fall under the 1600px long-edge floor), and the brand guidelines explicitly
allow AI generation as long as the result reads as photography: *"Génération ou augmentation IA acceptée
si le rendu reste photographique."*

These prompts are versioned because the images are derived artefacts. Regenerating a sub-page photo —
after art-direction feedback, or because a model was retired — must start from the text here, not from
a fresh improvisation, or the four heroes drift apart stylistically.

Generated with Higgsfield `soul_2` (`text2image_soul_v2`), `aspect_ratio: "3:4"`, default 2k quality.

## The canonical style tail

The designer's guidelines end on a single reusable prompt whose only variable is the subject, written
as `[Dynamic athlete portrait]` in the source document. Everything after that bracket is fixed. Each
of the four prompts below is **one subject clause + this tail**, minus the two clauses noted after it.

```
bold saturated colors, no pastel, no overexposure, natural golden hour light OR strong
directional studio light, deep shadows, daring framing, fisheye lens, extreme low angle or
dutch tilt, subject off-center, surreal or physically impossible scene, raw energy, intense
or euphoric expression, motion blur or frozen peak action, vivid sky with dramatic clouds,
cinematic color grading, hyper-real not hyperrealistic, editorial sports photography style,
shot on Phase One, 4K, no white background, no flat lighting, no neutral expression
```

Two clauses are dropped per prompt where they contradict the subject: `vivid sky with dramatic clouds`
is only kept for the one outdoor frame, and the light is resolved to one side of the `OR` rather than
left ambiguous.

## Never write the constraint as a negation

The hard requirement is that no brand mark, logo, crest, race bib or legible lettering appears anywhere
in frame — that is precisely what disqualified the prototype set, so a regeneration that reintroduces
one reintroduces the blocker.

**Appending `no logos, no lettering, no brand marks` to the prompt does the opposite of what it says.**
Two generations were burned proving it: asking for a *sprinter in a plain unbranded kit, no race bib,
no numbers, no logos* returned a runner wearing a bib reading "SFNONE" under a fake "Parlopp" sponsor
oval, with "CH" printed on the thigh; asking for a group *with no chest badge, no patch, no emblem*
returned a shirt with a "BERIREX" sponsor wordmark and a heraldic crest. Naming the thing summons it,
and the sportswear vocabulary (`sprinter`, `kit`, `jersey`, a group `mid-shout`) carries sponsored-apparel
priors on its own.

Two rules follow, and both are load-bearing:

1. **Describe the garment positively as blank** — *"dressed in plain smooth cotton t-shirts in solid
   block colours, the fabric entirely blank and unprinted"* — or remove the garment from the frame
   (bare torso, silhouette).
2. **Avoid competition-sport vocabulary** for the subject. `dancer` and `friends` are safe; `sprinter`,
   `kit`, `jersey`, `team` are not.

Same rule for backgrounds: `no white background` is unreliable, so name the colour you do want
(*"deep saturated crimson and cyan background"*, *"dark saturated backdrop"*). The charter forbids
`fond blanc neutre` and the first pass produced two grey/white cycloramas by negation alone.

## The four prompts

Each subject is chosen against that page's lead copy in `src/content/site.ts` and against the accent
its hero band renders on (`src/components/subpage-accents.ts`) — the photo sits directly beside that
colour, so a subject whose own palette fights it reads as a mistake.

### `/approach` — accent `lemon`

> *"On part de la réaction, puis on remonte tout le fil pour l'obtenir."*

The page is about working backwards from a reaction, so the subject is the reaction itself, frozen:
weightlessness, nothing yet resolved. The only outdoor frame of the four, and the only one that keeps
the tail's `vivid sky` clause. Backlighting reduces the figure to a silhouette, which is also why this
one needed no anti-lettering work — there is no readable surface in the frame.

```
Single dancer suspended at the apex of an explosive leap, body fully extended and weightless,
shot from a radical extreme low angle so the figure floats free against an open sky, golden
hour backlight rimming the silhouette, bold saturated colors, no pastel, no overexposure,
natural golden hour light, deep shadows, daring framing, fisheye lens, extreme low angle,
subject off-center, surreal or physically impossible scene, raw energy, intense or euphoric
expression, frozen peak action, vivid sky with dramatic clouds, cinematic color grading,
hyper-real not hyperrealistic, editorial sports photography style, shot on Phase One, 4K,
no white background, no flat lighting, no neutral expression, plain unbranded clothing,
no brand marks, no logos, no legible text anywhere in frame
```

### `/cases` — accent `tangerine`

> *"Une sélection de projets où le craft rencontre les chiffres."*

Craft meeting numbers reads as measurable output, so the subject is peak effort at the instant it
converts into result. Rewritten from a sprinter to a bare-torso dancer for the reason above: with no
garment in frame there is no surface for a sponsor to appear on. The crimson ground sits under the
tangerine band without competing with it.

```
A dancer's bare torso and outstretched arms caught mid-explosive twist at the peak of the
movement, skin taut and glistening, droplets of water flying off the shoulders, seen from a
low dutch-tilted angle with the body pushed to the edge of the frame, deep saturated crimson
and cyan background, bold saturated colors, strong directional studio light, deep shadows,
daring framing, fisheye lens, subject off-center, raw energy, intense expression, motion blur
and frozen peak action, cinematic color grading, hyper-real not hyperrealistic, editorial
photography style, shot on Phase One, 4K, dark saturated backdrop
```

### `/culture` — accent `lyon` (blue)

> *"Nés sur le web, obsédés par la performance. Voici l'équipe et les principes derrière."*

The only page whose subject is a group rather than an individual — it is the one introducing the team.
Garments are unavoidable here, so this is the prompt that carries the positive "blank fabric" clause.
`collapsing into helpless laughter` replaced `mid-shout`, which was pulling stadium-crowd priors.

```
Three friends collapsing into helpless laughter together, packed tight into the frame with
arms tangled and one head cropped by the edge, dressed in plain smooth cotton t-shirts in
solid block colours, the fabric entirely blank and unprinted, deep saturated electric blue
and magenta gel background, hard coloured directional studio light throwing deep shadows,
bold saturated colors, daring framing, fisheye lens, dutch tilt, subjects off-center, raw
energy, euphoric expression, motion blur, cinematic color grading, hyper-real not
hyperrealistic, editorial photography style, shot on Phase One, 4K, dark saturated backdrop
```

### `/contact` — accent `ink` (black band, lemon type)

> *"Créons de la big emotion. Dites ce que vous construisez."*

The hero band is black with lemon type, so this is the one frame that has to carry its own light. An
extreme close-up puts the emotion at the exact scale the invitation asks for. The violet ground is what
separates the face from the black band behind it.

```
Extreme close-up of one face erupting into unposed laughter filling the entire frame, eyes
creased shut, fisheye lens at very close distance, saturated warm key light against a deep
saturated colour background, bold saturated colors, no pastel, no overexposure, strong
directional studio light, deep shadows, daring framing, dutch tilt, subject off-center, raw
energy, euphoric expression, cinematic color grading, hyper-real not hyperrealistic, editorial
portrait photography style, shot on Phase One, 4K, no white background, no grey seamless
backdrop, no neutral background, no flat lighting, no neutral expression, no brand marks,
no logos, no legible text anywhere in frame
```

## Output requirements

| Requirement | Value | Why |
|---|---|---|
| Aspect ratio | 3:4 portrait | The photo slot is a vertical column (`max-h-[38vh]` mobile / `md:max-h-[64vh]`, `object-contain`). Portrait fills it with the least letterboxing, mobile first. |
| Long edge | ≥ 1600px | The floor set by SWBE-103's acceptance criteria, which the prototype set failed at 1400px. Delivered at 2048px. |
| Format | JPEG | Served through `next/image`, which handles modern-format negotiation itself. |

## Acceptance check before shipping a regeneration

Open the file and confirm, in this order — the first two are what blocked SWBE-91 the first time:

1. No brand mark, logo, crest, bib, or legible lettering anywhere in frame, including garbled
   pseudo-text on clothing.
2. The background is a saturated colour, not white, grey, or beige (`Interdit : fond blanc neutre`).
3. Contrasted directional light with real shadows — not flat, not washed out.
4. The expression is marked and unposed; the framing is off-center, tilted, or from an improbable angle.
5. Long edge ≥ 1600px.
