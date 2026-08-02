# /approach — density and hierarchy proposal (2026-08)

Owner feedback (2026-08-03): the deliverables list read as "un peu trop énorme", and the
page as a whole as "beaucoup trop de choses, difficile à lire". The first point shipped
immediately (see step 0). This draft is the UI pass on the rest — a proposal, nothing
here is implemented.

## Diagnosis

The page is one `bg-paper` block with six `h2` headings whose visual sizes contradict
their document rank:

| Block                         | Heading | Visual size                              |
| ----------------------------- | ------- | ---------------------------------------- |
| Mission statement             | h2      | `clamp(2rem, 6.5vw, 5.5rem)`             |
| 3 service cards               | h2 ×3   | `text-2xl`                               |
| "Ce qu'on fait" catalogue     | h2      | `text-sm` eyebrow (items now `text-2xl`) |
| "Les outils qu'on manie" band | h2      | `text-sm` eyebrow                        |
| "50+" stat                    | p       | `clamp(3.5rem, 18vw, 13rem)`             |

Three separate problems compound into "trop de choses":

1. **Two crescendos.** The mission (5.5rem) and the stat (13rem) both claim the
   display-scale moment; with the hero h1 above, the page shouts three times.
2. **Flat outline, scrambled hierarchy.** Six sibling `h2`s span a 10× size range, so
   the eye cannot rank sections; the two eyebrows (0.875rem) rank _below_ the list
   items they title.
3. **Four introductions.** The hero lead, the mission, the service bodies and
   `expertise.lead` each restate what the agency does before the offer itself appears.

## Proposal (each step independently shippable)

- **Step 0 — shipped.** Catalogue items dropped from `clamp(1.75rem, 6vw, 4rem)` to
  the service-card `text-2xl`: the offer reads as a list again, not a second wall of
  headlines. (`src/components/sections/approach.tsx`)
- **Step 1 — one crescendo.** Keep the mission as the page's single display moment.
  Bring the stat down to the mission's scale (e.g. `clamp(2rem, 6.5vw, 5.5rem)`), or
  fold "50+ projets accompagnes" into a closing mission-sized line. The page then
  reads hero → statement → offer → proof, with one peak.
- **Step 2 — group the offer.** Wrap cards + catalogue + toolbox under a single
  "Ce qu'on fait" `h2`, demoting card titles and the toolbox title to `h3`. One
  section = one idea; the outline matches what the eye sees.
  `approach.test.tsx` pins the current six-h2 order and must move in lockstep.
- **Step 3 — one eyebrow pattern.** After step 2 a single eyebrow style remains for
  sub-sections (`text-sm tracking-[0.2em]`); it labels, the content carries the size.
- **Step 4 — a middle beat.** The charter's page rhythm is alternating full-bleed
  fields (BRAND.md §7), and /approach is the only section page without one. Set the
  catalogue (or the toolbox strip) on an `ink` field with `paper`/`lemon` type. Flat
  colour fields only — no new hex, tokens as-is.
- **Step 5 — cut one introduction.** `expertise.lead` restates the mission's promise
  one screen after the mission. Drop it, or cut it to the "Agence digitale 360" clause
  alone. (FR copy stays tutoiement; the items are display slots, ASCII-only.)

Steps 1 and 5 are copy/size-only. Step 2 changes heading semantics and the colocated
test. Step 4 is the only visual-direction change and should get a look from the
designer before it ships.
