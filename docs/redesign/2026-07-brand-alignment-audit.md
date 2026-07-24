# Brand Alignment Audit — July 2026

Status: draft for owner review — produced 2026-07-20, before any implementation.
Companion document: [`2026-07-brand-alignment-backlog.md`](./2026-07-brand-alignment-backlog.md) (ticket drafts derived from this audit).

## 1. Sources of truth

| Source                            | Location                                                                                                   | Role                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Brand Guidelines V1.0 (June 2026) | `brand/big-emotion-brand-guidelines.pdf` (committed; byte-identical to the designer's `BE_compressed.pdf`) | **Canonical DA reference** — logo rules, palette, typography, iconography, tone, formats |
| Designer website deck             | `~/Documents/BIG_EMOTION/test.pdf` (9 pages, not committed)                                                | Screen-by-screen target for the home scroll experience                                   |
| Designer target site              | https://bigemotion.netlify.app/                                                                            | Living reference: real pages, FR/EN i18n, 3D scroll scene                                |
| Designer 3D logo (source)         | `~/Documents/BIG_EMOTION/BE-3d.glb` (7.1 MB, THREE.GLTFExporter r166, **no Draco**, no indices)            | Raw asset                                                                                |
| Designer 3D logo (optimized)      | https://bigemotion.netlify.app/BE-logo-3D.min.glb (45,592 bytes, **Draco-compressed**, same generator)     | Ship-ready asset                                                                         |
| Live site                         | https://big-emotion.com/                                                                                   | Current state to align                                                                   |

## 2. Brand reference (extract of the canonical facts)

### Logo

- The wordmark is **“B!G EMOTION”** — the I of BIG is an exclamation mark. A **“B!” monogram** (black rounded square) serves as favicon/app icon.
- Rules (PDF p.2, verbatim, FR): _“Le logo est un bloc. On préserve sa zone de protection (= la hauteur du !) et on ne le déforme jamais. Ne pas utiliser d’autres associations de couleurs que celles proposées ici, ne pas étirer ni déformer sauf pour un habillage graphique, ne pas ajouter d’ombre, contour ou effet, ne pas poser un fond qui nuit au contraste.”_
- Allowed color pairings: the “Associations” grid (PDF p.4) — logo in black / lemon / orange / blue / white / grey over the palette backgrounds shown there, plus lemon-on-photo (p.2).
- The **typography may be stretched/condensed as a graphic signature; the logo never** (PDF p.9–10).

### Palette (PDF p.3)

| Name             | Hex       | Repo token                                      |
| ---------------- | --------- | ----------------------------------------------- |
| Lemon Yellow     | `#f2ff26` | `--color-lemon` ✓                               |
| Orange Tangerine | `#ff5200` | `--color-tangerine` ✓                           |
| Deep Lyon Blue   | `#0024cc` | `--color-lyon` ✓                                |
| Brutal Grey      | `#dbdbdb` | `--color-brutal` ✓ (declared, currently unused) |
| Black            | `#000000` | `--color-ink` ✓                                 |
| White            | `#ffffff` | `--color-paper` ✓                               |

Note: the Netlify prototype uses slightly different hex values (`#e6ff00`, `#ff3b00`, `#1226e6` in its `main.js`). **The PDF palette wins**; the repo already matches the PDF.

### Typography (PDF p.5)

- **BBH** — variable family in three widths: **BBH Bogle** (condensed), **BBH Hegarty** (regular), **BBH Bartle** (expanded). Roles: SUBTITLE = Hegarty; TITLE = Bogle / Hegarty / Bartle (width is an expressive axis).
- **Bricolage Grotesque Regular** — body.
- The PDF states all fonts are on Google Fonts. Verified 2026-07-20: [BBH Sans Bogle](https://fonts.google.com/specimen/BBH+Sans+Bogle), [BBH Hegarty](https://fonts.google.com/specimen/BBH+Hegarty), [BBH Sans Bartle](https://fonts.google.com/specimen/BBH+Sans+Bartle) (Studio DRAMA) + Fontsource variable packages exist (`bbh-sans-bogle`, `bbh-sans-bartle`, …). The designer’s prototype self-hosts `BBHHegarty-Regular.ttf` and uses **Hegarty as the single display face**.

### Iconography (PDF p.7)

Studio or natural settings, contrasted directional light, saturated colors, bold framing (fisheye, extreme close-up, dutch tilt…), surrealist scenes, real emotions. Forbidden: neutral white background, flat lighting, pastel, washed overexposure. Canonical AI generation prompt (verbatim, keep as-is in any image-generation ticket):

> [Dynamic athlete portrait], bold saturated colors, no pastel, no overexposure, natural golden hour light OR strong directional studio light, deep shadows, daring framing, fisheye lens, extreme low angle or dutch tilt, subject off-center, surreal or physically impossible scene, raw energy, intense or euphoric expression, motion blur or frozen peak action, vivid sky with dramatic clouds, cinematic color grading, hyper-real not hyperrealistic, editorial sports photography style, shot on Phase One, 4K, no white background, no flat lighting, no neutral expression

### Tone of voice (PDF p.8) & personality slider (PDF p.9)

Tutoiement, short sentences, action verbs, no corporate jargon. Values: Audace · Sincérité · Énergie · Simplicité radicale · Exigence créative. Brand personality slider axes (dot position, 0 = left, 100 = right, read visually from the PDF — confirm with designer before pixel-perfect use): Formal↔Casual ≈ 55, Cold↔Warm ≈ 35, Serious↔Playful ≈ 45, Detailed↔Minimal ≈ 65, Corporate↔Friendly ≈ 42, Complex↔Simple ≈ 55. (PDF spellings “Coold”/“Detalied” are typos — do not reproduce.)

### Website art direction (PDF p.12–13, test.pdf)

- **Load screen**: looping logo animation before the site (“B!G” repeated in a wavy horizontal loop, black on white), favicon = B! tile.
- **Home**: full-size sections alternating flat color / white / photos; typography and photos always forward; zoom/parallax transitions; “straight to the point” minimal content. Hero mock: **centered** “THE B!G AGENCY THAT GIVES A WOW.” with the **SCROLL pill directly below**; intro paragraph bottom-right.
- **Scroll story** (test.pdf + Netlify): chrome 3D “B!G EMOTION” grows monotonically through sections lemon → orange → blue → black → white, turning and sliding to free space for text; follows the mouse; ends face-on above the closing manifesto with social icons.

### Stationery / formats (PDF p.14–15)

Business card (Jean-Noé Kollo), A4 document header, **mail signature**, PPT cover + back page. Contact block used across formats: `CONTACT @ BIG-EMOTION.COM · BIG-EMOTION.COM · @BIG-EMOTION ON SOCIALS · +33 7 03 676 43 22`. Closing page: “HEY MERC!”.

## 3. Live-site findings (big-emotion.com, audited mobile-first at 390 px, then 1440 px)

### Conformant today

| Area           | Evidence                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color tokens   | `src/app/globals.css:6-11` — all six values match the PDF exactly                                                                                                                                                                                             |
| Body typeface  | Bricolage Grotesque variable, self-hosted (`src/app/layout.tsx:24-29`)                                                                                                                                                                                        |
| Copy voice     | `src/content/site.ts` follows the tone (tutoiement, taglines from the PDF)                                                                                                                                                                                    |
| Contact form   | Works (SWBE-31): `contact-form.tsx` → `/api/contact` → Graph seam. The designer’s target has **no** form (mailto only) — **keep ours**                                                                                                                        |
| Scene pipeline | `src/components/scene/scene-canvas.tsx` is a faithful port of the designer’s `main.js` (same states, chrome material `metalness 1 / roughness 0.22 / envMapIntensity 1.15`, camera fov 42, Lenis lerp 0.09, GSAP scrub, mouse parallax `ry ±0.10 / rx ±0.06`) |

### Non-conformant / gaps

| #   | Area                     | Current state                                                                                                                                    | Target                                                                                                                                                 | Root cause / evidence                                                                                                                                                                           |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Display typeface         | **Archivo Variable** stand-in, variable literally named `--font-bbh`                                                                             | BBH (Hegarty primary; Bogle/Bartle for graphic play)                                                                                                   | `src/app/layout.tsx:14-21` comment says BBH “is not libre” — **outdated**: BBH is on Google Fonts now                                                                                           |
| G2  | Logo                     | Text-based wordmark “B!G / EMOTION” in Archivo 800 (`src/components/wordmark.tsx`); favicon `src/app/icon.svg` draws “B!” in **Arial**           | Official drawn logo block + B! monogram, protection zone = height of “!”, allowed color pairs only                                                     | No vector logo asset exists in the repo (`public/` has none)                                                                                                                                    |
| G3  | Hero layout              | `h1` left-aligned; “Scroll ↓” is a dead `<span>` bottom-left **plus** a `pointer-events:none` “Scroll” pill (`hero.tsx:3-20`, `globals.css:167`) | Tagline **centered**, SCROLL pill **directly below**, and (owner requirement, stricter than the prototype) **clickable** → scrolls to the next section | PDF p.13 mock; Netlify pill is also non-clickable — we exceed the prototype                                                                                                                     |
| G4  | Load screen              | Lemon background, 12 flat “B!G” spans in Archivo sliding out (`load-screen.tsx`, `globals.css:54-81`)                                            | White background, wavy “B!G” **loop** per PDF p.12, logo glyphs                                                                                        | Concept exists, styling and glyphs off                                                                                                                                                          |
| G5  | 3D hero                  | `public/models/scene.glb` is a **92-byte placeholder** — the scene renders nothing; fallback text shows                                          | Chrome 3D logo growing through 6 scroll states                                                                                                         | Real asset never shipped. Ship-ready Draco file exists (45 KB, Netlify). Watch: designer’s `main.js` applies `FACE_OFFSET = -Math.PI/4` for a baked 45° Y rotation — verify the port handles it |
| G6  | Information architecture | One-page with anchors (`/#approach`…)                                                                                                            | Real pages `/approach` `/cases` `/culture` `/contact`, each “title + text left / photo right” (`subpage-text` + `subpage-photo` on Netlify)            | Structural evolution — needs an ADR (legacy WP 301s in `next.config.ts:16-51` must follow)                                                                                                      |
| G7  | i18n                     | None; `<html lang="fr">`, EN strings tagged inline                                                                                               | FR/EN switch (Netlify: client-side `i18n.js` dictionary, FR + EN full translations)                                                                    | Needs an ADR; couples with the Prismic decision                                                                                                                                                 |
| G8  | Contact email            | `contact@big-emotion.com` in 12+ places (see backlog C1 for the list)                                                                            | **`hello@big-emotion.com`** (owner decision, inspired by the designer’s `hello@bigemotion.agency`)                                                     | Mailbox does not exist yet — owner action first                                                                                                                                                 |
| G9  | Client-area domain       | `support.big-emotion.com` (CTA `site.ts:36`, portal on the VPS)                                                                                  | **`b2b.big-emotion.com`**; mailbox `support@` → `b2b@`                                                                                                 | Owner decision; cross-repo + DNS + Traefik + M365                                                                                                                                               |
| G10 | Cases content            | `MAMIEZI` (keep, outdated, no link) + `AdoléBâtisseur` (**remove** — owner decision) in `site.ts:68-85`                                          | MAMIEZI refreshed + real client references (AXA, … from the owner’s Malt profile) — content to be provided, later editable via CMS                     | Content debt, not blocking                                                                                                                                                                      |
| G11 | Team content             | “Sylvain Seng Bandith” (`site.ts:96`) — LinkedIn spells **Sengbandith**; bios are one-liners                                                     | Richer bios sourced from https://www.sylvainsengbandith.fr/ + LinkedIn; spelling to confirm                                                            | Content debt                                                                                                                                                                                    |
| G12 | Personality slider       | Absent                                                                                                                                           | Brand personality slider module (PDF p.9)                                                                                                              | New component                                                                                                                                                                                   |
| G13 | Social links             | Footer prints `@big-emotion on socials` as plain text; no social links                                                                           | Designer’s final screen shows Facebook/X/Instagram/YouTube/LinkedIn/TikTok/WhatsApp icons + `@BIGEMOTIONAGENCY` handle                                 | Handles to confirm with owner                                                                                                                                                                   |

## 4. Designer prototype — implementation intelligence

Cached copies of the prototype sources are session artifacts; re-fetch from https://bigemotion.netlify.app/ (`js/main.js`, `js/i18n.js`, `css/style.css`, `BE-logo-3D.min.glb`, `BBHHegarty-Regular.ttf`, `Photos/*.jpg`).

- **Scroll keyframes** (`main.js` STATES — scale/x/y/rx/ry per section): intro `s1.40` centered → approach `s2.30` right → cases `s2.80` left → culture `s3.30` right → louder `s3.80` left → final `s0.50, y0.34, ry −2π` face-on above the text. `HOLD 0.7`, `MOVE 1.0`, scrub 1. Mobile fit: `FIT = max(0.45, aspect·0.9)` when portrait.
- **Environment**: procedural “studio softbox” env (identical concept already ported in `scene-canvas.tsx`) + optional HDR upgrade; ACES tone mapping; micro roughness/normal canvas maps for satin chrome.
- **i18n mechanism**: `data-i18n` keys + JS dictionary, FR/EN buttons, nav labels FR: APPROCHE / RÉFÉRENCES & IMPACT / CULTURE / CONTACT.
- **Sub-page copy** (EN, reusable as first real content): Approach “We start with the reaction, then reverse engineer everything…”; Cases “Selected work where craft met numbers…”; Culture “Born on the web, obsessed with performance…” (FR versions in `i18n.js`); Contact “Got a brand that deserves to be louder? Tell us what you’re building.” + `hello@…`.
- **Footer**: `© 2026 Big Emotion. We don’t make websites, we create impact.`

## 5. Local brand-asset folder (`~/Documents/BIG_EMOTION`)

- `Logos_ByTailorBrands/` (2023), `favicon*.ico` (Nov 2025), `logo_*.png` — **previous identity, now obsolete**; to archive once the new logo exports exist (backlog D5).
- `BE-3d.glb` — raw 3D source (7.1 MB); prefer the 45 KB Draco `BE-logo-3D.min.glb` for the web; keep the raw file as the master.
- No SVG/AI vector of the new logo is present anywhere — **request from designer** (or extract the vector from the PDF). This blocks pixel-perfect logo work (G2).

## 6. Screenshots

Captured 2026-07-20 with Playwright (390×844 and 1440×900): live hero (mobile + desktop), live full page (mobile), target hero/scroll ×2 (mobile + desktop), target sub-pages approach/cases/culture/contact. Published with annotations in the implementation-reference artifact (<https://claude.ai/code/artifact/cf126d9b-644e-41f5-a47b-4a9f6fedaf8e>) and summarized on the Confluence visual page (<https://big-emotion.atlassian.net/wiki/spaces/SW/pages/173572109>); web-ready JPEGs live in `~/Documents/BIG_EMOTION/audit-2026-07/screenshots/` (along with the 45 KB Draco GLB and `BBHHegarty-Regular.ttf`). Regenerate at will — both sites are public.

## 7. Arbitrations already taken by the owner (do not re-litigate in tickets)

1. `hello@big-emotion.com` replaces `contact@` (public contact address).
2. `support@` mailbox becomes `b2b@`; `support.big-emotion.com` becomes `b2b.big-emotion.com`.
3. AdoléBâtisseur leaves the case list; MAMIEZI stays (refreshed later).
4. Marketing content will become editable through **Prismic** (CMS decision made; integration design still open → ADR).
5. Site becomes FR/EN.
6. The contact **form** stays (no regression to mailto-only).
7. Scroll pill must be **clickable** (stricter than the prototype).
