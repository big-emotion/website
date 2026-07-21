# Sub-page photo sourcing — findings (SWBE-91)

Status: **resolved** — the owner took option 2 of §6 on 2026-07-21. The four photos were generated
to the brand's iconography rules and now ship under `public/photos/`; the prompts behind them are
versioned in [`2026-07-subpage-photo-prompts.md`](./2026-07-subpage-photo-prompts.md). §4 below is
what has changed: this run did have image generation available.

The rest of this document is kept as the record of *why* the designer's prototype JPEGs were not
shipped — that reasoning still governs any future photography added to this site.

Ticket: [SWBE-91](https://big-emotion.atlassian.net/browse/SWBE-91) "Brand-compliant photography set for the sub-pages". Companion documents: [`2026-07-brand-alignment-audit.md`](./2026-07-brand-alignment-audit.md) §2 (iconography rules), [`2026-07-brand-alignment-backlog.md`](./2026-07-brand-alignment-backlog.md) B6.

## 1. Mapping (SWBE-101 — done)

Read each sub-page's `<img src>` on the designer's target site. The mapping is a clean 1:1:

| Sub-page | Source URL | Target filename |
|---|---|---|
| `/approach` | `https://bigemotion.netlify.app/Photos/approach.jpg` | `public/photos/approach.jpg` |
| `/cases` | `https://bigemotion.netlify.app/Photos/cases.jpg` | `public/photos/cases.jpg` |
| `/culture` | `https://bigemotion.netlify.app/Photos/culture.jpg` | `public/photos/culture.jpg` |
| `/contact` | `https://bigemotion.netlify.app/Photos/contact.jpg` | `public/photos/contact.jpg` |

No missing or shared images — every sub-page has its own dedicated file.

## 2. What the four source files actually are

B6's locked decision states *"v1 = the designer's own prototype photos — they are the designer's art direction and count as Done."* That assumes the four JPEGs are generic mood/style photography the designer produced or licensed for this prototype. Fetching and visually inspecting the actual pixels shows otherwise:

| File | Long edge | ≥1600px (SWBE-103 AC)? | Visual content |
|---|---|---|---|
| `approach.jpg` | 1400px | No | Athlete on a basketball hoop against a sunset sky. No clearly legible brand marks, but styled as professional advertising photography, not an original BIG EMOTION shoot. |
| `cases.jpg` | 1400px | No | A basketball player wearing a jersey printed **"PARIS"** with a visible **adidas** wordmark on the socks — this is stock/editorial creative from an **Adidas × Paris Basketball** campaign. |
| `culture.jpg` | 1400px | No | An SUV badged **"问界 M9"** (AITO M9) driving through snow past a yak herd — this is automotive advertising creative for the **AITO M9** (Huawei-backed EV brand). |
| `contact.jpg` | 1400px | No | A model with smiley-face stickers on her face in a beauty/lifestyle campaign style shot. No legible brand mark, but again styled as third-party commercial creative, not BIG EMOTION's own. |

Two of the four (`cases.jpg`, `culture.jpg`) carry **visible third-party trademarks** (Adidas, AITO/Huawei) with no relation to BIG EMOTION's actual approach/cases/culture/contact content. All four also fall short of the ≥1600px long-edge floor both the ticket and B6's own acceptance criteria set.

## 3. Why this blocks the ticket

- **IP/trademark risk.** These look like placeholder images the designer scraped from the web to fill the prototype layout, not assets BIG EMOTION has any right to publish on its production, client-facing site. Shipping `cases.jpg` (Adidas) or `culture.jpg` (AITO M9) to `big-emotion.com` risks a takedown/legal complaint and is unrelated to what those sections are actually about (BIG EMOTION's case studies, BIG EMOTION's culture).
- **Resolution.** Even setting IP aside, all four fail the ≥1600px minimum both SWBE-103 and B6 specify (max is 1400px).
- **The "v1 = Done" premise doesn't hold once you look at the pixels.** The locked decision reads as if it were made from the `<img src>` mapping alone, without opening the files — reasonable given the audit was "produced before any implementation," but it needs re-confirming now that the actual content is known.

Given this, `public/photos/` was **not** created and no image files were committed in this PR — committing them would mean shipping copyrighted competitor advertising creative as if it were BIG EMOTION's own brand photography.

## 4. What this coding agent cannot do

SWBE-107's fallback is to generate replacements with the canonical AI prompt (audit §2, brand guidelines confirm *"Génération ou augmentation IA acceptée si le rendu reste photographique"*). This run has no image-generation tool available, so that path can't be executed here — it needs either a designer/owner-supplied photo set or a separate pipeline with image-generation capability.

## 5. Also structurally blocked regardless

SWBE-108 (wiring photos into sub-page components via `next/image`) depends on B1/SWBE-22 landing the real `/approach` `/cases` `/culture` `/contact` routes and the shared `SubpageLayout`. Confirmed via `src/app/`: only `(auth)`, `api`, and `fonts` exist today — no marketing sub-page routes. This part of the scope is out of reach until B1 ships, independent of the photo-sourcing question above.

## 6. Recommendation

Owner/designer to choose one of:
1. Supply an actual BIG EMOTION-owned or licensed photo per sub-page (≥1600px long edge), or
2. Approve running the canonical AI-generation prompt (audit §2) for all four subjects via a pipeline with image-generation access, or
3. Confirm (in writing, as a new locked decision) that the four scraped placeholder images are acceptable to ship as-is despite the visible third-party trademarks — not recommended.

Once one of those is decided, SWBE-103/SWBE-107 can be completed and this ticket revisited.
