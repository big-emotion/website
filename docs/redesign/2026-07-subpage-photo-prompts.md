# Sub-page photography — generation prompts (SWBE-91)

The four prompts that produced the hero images of the four marketing sub-pages
(`approach`, `cases`, `culture`, `contact`), at 1536×2048 (3:4 portrait).

This resolves option 2 of [`2026-07-photo-sourcing-findings.md`](./2026-07-photo-sourcing-findings.md) §6:
the designer's four prototype JPEGs could not ship (two carry visible third-party trademarks — adidas,
AITO/Huawei — and all four fall under the 1600px long-edge floor), and the brand guidelines explicitly
allow AI generation as long as the result reads as photography: _"Génération ou augmentation IA acceptée
si le rendu reste photographique."_

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
Two generations were burned proving it: asking for a _sprinter in a plain unbranded kit, no race bib,
no numbers, no logos_ returned a runner wearing a bib reading "SFNONE" under a fake "Parlopp" sponsor
oval, with "CH" printed on the thigh; asking for a group _with no chest badge, no patch, no emblem_
returned a shirt with a "BERIREX" sponsor wordmark and a heraldic crest. Naming the thing summons it,
and the sportswear vocabulary (`sprinter`, `kit`, `jersey`, a group `mid-shout`) carries sponsored-apparel
priors on its own.

Two rules follow, and both are load-bearing:

1. **Describe the garment positively as blank** — _"dressed in plain smooth cotton t-shirts in solid
   block colours, the fabric entirely blank and unprinted"_ — or remove the garment from the frame
   (bare torso, silhouette).
2. **Avoid competition-sport vocabulary** for the subject. `dancer` and `friends` are safe; `sprinter`,
   `kit`, `jersey`, `team` are not.

Same rule for backgrounds: `no white background` is unreliable, so name the colour you do want
(_"deep saturated crimson and cyan background"_, _"dark saturated backdrop"_). The charter forbids
`fond blanc neutre` and the first pass produced two grey/white cycloramas by negation alone.

## Faces in frame, lit

Cropping the head out is the cheapest way to guarantee no readable surface for a logo — and it is a
trap. Two of the first four heroes did it (a backlit silhouette on `/approach`, an arched headless
torso on `/cases`) and the owner rejected both in the same terms: _"trop sombre, mystérieux"_,
_"le personnage est suspect, effrayant."_

A body without a face in low light reads as menacing, not energetic. The brand's own moodboard is
faces and explicit joy throughout. **Keep the face in frame, lit, and expressive** — solve the logo
problem with blank fabric, not by hiding the person.

## The four prompts

Each subject is chosen against that page's lead copy in `src/content/site.ts` and against the accent
its hero band renders on (`src/components/subpage-accents.ts`) — the photo sits directly beside that
colour, so a subject whose own palette fights it reads as a mistake.

### `/approach` — accent `lemon`

> _"On part de la réaction, puis on remonte tout le fil pour l'obtenir."_

The page starts from the reaction and works backwards, so the subject **reacts toward the viewer** —
hands thrown at the lens, caught at the moment of contact. It also echoes a pose from the designer's
own moodboard.

The first version here was a backlit dancer reduced to a silhouette against a sunset, and it was
rejected under the faces rule above. The cobalt ground gives the hardest contrast against this page's
`bg-lemon` band.

```
A laughing young man lunging toward the camera with both hands thrown out at the lens, palms
wide and blurred by the movement, face fully visible and brightly lit behind them, shot on a
fisheye lens at very close distance against a deep saturated cobalt blue background, dressed
in a plain smooth t-shirt in a solid block colour with the fabric entirely blank and
unprinted, bold saturated colors, strong directional studio light, deep shadows, daring
framing, dutch tilt, subject off-center, raw energy, euphoric expression, motion blur and
frozen peak action, cinematic color grading, hyper-real not hyperrealistic, editorial
photography style, shot on Phase One, 4K
```

### `/cases` — accent `tangerine`

> _"Une sélection de projets où le craft rencontre les chiffres."_

Craft meeting numbers reads as measurable output, so the subject is the moment the effort lands.

Beyond the faces rule above, this page carries its own colour trap. The first accepted version put a
low-key crimson-and-cyan frame beside `bg-tangerine`, on the reasoning that a red-adjacent ground
would not fight the orange. On screen it does the opposite: two neighbouring reds turn to sludge, and
a low-key image dies against a field that bright. **Turquoise is complementary to the tangerine and is
what makes the photo read.** The inverse trap is just as real — a subject wearing tangerine dissolves
into the band, so keep the garment off that hue.

```
A joyful athletic woman leaping high with a wide open smile, face clearly visible and lit,
one arm thrown up in triumph, hair flying, shot from a radical low angle against a vivid
electric turquoise sky, dressed in a plain smooth tank top in a solid block colour with the
fabric entirely blank and unprinted, bold saturated colors, strong golden directional light
on the face, deep shadows, daring framing, fisheye lens, subject off-center, raw energy,
euphoric expression, frozen peak action, cinematic color grading, hyper-real not
hyperrealistic, editorial sports photography style, shot on Phase One, 4K
```

### `/culture` — accent `lyon` (blue)

> _"Nés sur le web, obsédés par la performance. Voici l'équipe et les principes derrière."_

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

> _"Créons de la big emotion. Dites ce que vous construisez."_

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

| Requirement  | Value        | Why                                                                                                                                                             |
| ------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aspect ratio | 3:4 portrait | The photo slot is a vertical column (`max-h-[38vh]` mobile / `md:max-h-[64vh]`, `object-contain`). Portrait fills it with the least letterboxing, mobile first. |
| Long edge    | ≥ 1600px     | The floor set by SWBE-103's acceptance criteria, which the prototype set failed at 1400px. Delivered at 2048px.                                                 |
| Format       | JPEG         | Served through `next/image`, which handles modern-format negotiation itself.                                                                                    |

## Acceptance check before shipping a regeneration

Open the file and confirm, in this order — every one of these was learned by shipping its opposite:

1. No brand mark, logo, crest, bib, or legible lettering anywhere in frame, including garbled
   pseudo-text on clothing.
2. The face is in frame, lit, and expressive — no silhouettes, no headless bodies.
3. The background is a saturated colour, not white, grey, or beige (`Interdit : fond blanc neutre`),
   and it does not sit next to the page's own accent on the colour wheel.
4. Contrasted directional light with real shadows — not flat, not washed out.
5. The expression is marked and unposed; the framing is off-center, tilted, or from an improbable angle.
6. Long edge ≥ 1600px.
