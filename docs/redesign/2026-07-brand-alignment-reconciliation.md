# Brand Alignment Backlog — Reconciliation against the existing spec tree

Status: reconciliation reference. **Publish progress:** A1, B4, B6 published 2026-07-21 (see "Publish log" at the end). The rest is held or folded.
Produced 2026-07-20.
Inputs: [`2026-07-brand-alignment-backlog.md`](./2026-07-brand-alignment-backlog.md) (19 drafts A1–E1) reconciled against the live Confluence engineering tree and the `SWBE` Jira project.

## Why this document exists

The backlog was drafted from the brand sources (Brand Guidelines V1.0, the scroll storyboard, the Netlify preview). The Confluence engineering tree was **seeded on 2026-07-18 from the same sources**, and the `SWBE` project already carries an 89-issue tree with several *open* revamp tickets. So most backlog drafts do not describe new spec — they re-describe requirements/decisions/architecture that already exist, and in three places they contradict a decision the tree already records.

Running `/bigemotion-spec` to "publish 19 REQ/DEC + 19 tickets" would therefore mint parallel IDs, duplicate open tickets, and leave two contradictory decisions in the tree. This document is the reconciliation the owner reviews before any publish.

## Snapshot reconciled against (2026-07-20)

- **Requirements:** REQ-001 → REQ-028 (all `Pending`). Next free ID: **REQ-029**.
- **Decisions:** DEC-001 → DEC-022 (all `Pending`). Next free ID: **DEC-023**.
- **Architecture:** ARCH-001 → ARCH-016 (all `Pending`). Next free ID: **ARCH-017**.
- **Jira `SWBE`:** 89 issues. Open (`À faire` / `Revue en cours`) tickets relevant to the revamp:
  - Revamp epic **SWBE-18**: SWBE-21 (one-pager restructure: 6 panels + routed FR/EN next-intl), SWBE-22 (subpages /approach /cases /culture /contact), SWBE-23 (Storybook), SWBE-24 (Prismic pilot), **SWBE-78** (integrate real BE-3d.glb + align hero to preview), **SWBE-77** (bug: hero 3D z-index regression).
  - Espace epic **SWBE-25**: SWBE-28/29/30.
  - Ops epic **SWBE-32**: SWBE-33 (backups), 34 (legal), 35 (monitoring), 36 (recette), 37 (mail), 38 (VPS hygiene).
  - Prismic epic **SWBE-79**: SWBE-80/81/82.
  - Audit epic **SWBE-83**: SWBE-84…89.

## Per-draft reconciliation

Verdict legend: **NEW** = no existing coverage · **FOLD** = duplicate of an open ticket, attach work there · **RESOLVE** = updates/answers an existing `Pending` section · **CONFLICT** = contradicts an existing decision.

| Draft | Intent | Existing coverage | Verdict | Blocker |
|---|---|---|---|---|
| **A1** | BBH display face, retire Archivo | REQ-016 (BBH width signature); **DEC-008 = OPEN arbitration** (BBH vs libre vs Archivo); SWBE-43 (Done, chose Archivo interim) | **RESOLVE** DEC-008 (new DEC supersedes it, records BBH-on-Google-Fonts verified 2026-07-20) + impl ticket. Do **not** mint a new REQ. | — unblocked |
| **A2** | Official logo block + B! monogram | none | **NEW** | Vector logo (SVG/AI) does not exist |
| **A3** | Centered hero + clickable SCROLL pill | REQ-010 / ARCH-009 (scroll hero); open SWBE-21, SWBE-78 | **FOLD** impl into SWBE-21/78; optional focused REQ-029 for the clickable-pill + single-cue contract | — unblocked |
| **A4** | Load screen wavy B!G loop | none | **NEW** | Depends A2 (vector logo) |
| **A5** | Ship the real 45 KB Draco GLB | **open SWBE-78**; bug SWBE-77; REQ-010/013, ARCH-008 (holder cancels baked 45° Y already recorded) | **FOLD into SWBE-78** | — unblocked (asset in `audit-2026-07/`) |
| **A6** | Footer social-icons row | none | **NEW** | Social profile URLs owed |
| **B1** | Real routes per nav entry | **open SWBE-21 + SWBE-22**; REQ-015 | **FOLD** | — unblocked |
| **B2** | FR/EN i18n | **open SWBE-21**; REQ-014 / DEC-010 / ARCH-010 | **FOLD + CONFLICT #1** | — |
| **B3** | Prismic CMS | **open epic SWBE-79 → 80/81/82** + SWBE-24; REQ-026/027, DEC-020/021, ARCH-016 | **FOLD + CONFLICT #2** | Prismic account/token (owner) |
| **B4** | Brand personality slider | none | **NEW** | ~unblocked (confirm dot positions with designer before merge) |
| **B6** | Brand-compliant photo set | none | **NEW** | unblocked (v1 = designer prototype photos) |
| **C1** | `hello@` replaces `contact@` | REQ-004/020/024, DEC-015, ARCH-014 (name `contact@` recipient, `espace@` sender) | **NEW decision + CONFLICT #3** | `hello@` mailbox creation (owner) |
| **C2** | `b2b@` + `b2b.big-emotion.com` | none (owner arbitration only) | **NEW decision**, cross-repo | Support repo URL, DNS, M365 (owner) |
| **D1–D5** | Word/email-sig/PPT/card/asset-cleanup | none | **NEW but not website spec** (local files, no deploy, no REQ/DEC/ARCH impact) | All blocked on the vector logo |
| **E1** | Keep `AGENTS.md` true | none | Fold as Definition-of-Done on each ticket (as the backlog itself states) — no standalone ticket | — |

## Three conflicts — RESOLVED by the owner 2026-07-20

Each backlog draft contradicted a decision already in the tree. The owner resolved all three below. The rule stands: do not add a contradictory `NEW` section alongside the old one — supersede the old with an append-only successor carrying `Supersedes:`.

1. **i18n locale direction (B2 vs DEC-010 / REQ-014 / ARCH-010).**
   - **Decision: FR is the default locale at `/`; EN lives under `/en/`.** Bilingual FR/EN, both locales managed in Prismic (`fr` / `en`).
   - This reverses the tree. On publish: a new DEC **supersedes DEC-010**, a superseding REQ replaces **REQ-014**, and a new ARCH replaces **ARCH-010** (`localePrefix "as-needed"`, `/` = FR, `/en/` = EN, hreflang + per-locale OG). All lands on the open **SWBE-21**. Do not edit the old sections' bodies — append successors.

2. **Prismic scope / first type (B3 vs REQ-027 / SWBE-81).**
   - **Decision: Home is the v1 slice-ification pilot, then every marketing page becomes Prismic-managed** (bilingual `fr`/`en`). The backlog's "cases-first" suggestion is dropped.
   - No conflict remains — this matches REQ-027 / DEC-020 / SWBE-81 as written. B3 folds into the open **SWBE-79 → 80/81/82**; the "each page" extension is the follow-up-per-type work already implied by REQ-027.

3. **Transactional-mail sender (C1 vs DEC-015 / ARCH-014 / REQ-024).**
   - **Decision: the contact form sends `From` = `Reply-To` = `hello@big-emotion.com`. Portal mail (magic-link sign-in, support escalations) keeps `espace@big-emotion.com`.**
   - `src/lib/mail.ts` stays the single send **path**; the `From` becomes per-purpose. On publish this **relaxes REQ-024** ("single sender identity" → "single send path, per-purpose `From`") via a superseding REQ, and adds a note to DEC-015 / ARCH-014 that the contact relay uses `hello@`. Fold in the audit's correction that the live env var is **`MAIL_SENDER`**, not the dead `MAIL_FROM`.

## Blocked on owner-owed inputs (10 of 19)

The bilan already lists these as still owed; creating the tickets now would breach the self-sufficient-ticket bar:

- **Vector logo (SVG/AI):** gates A2, A4, and the entire D1–D5 local track.
- **Social profile URLs:** A6.
- **`hello@` mailbox in M365:** C1.
- **Support-portal repo URL + `b2b.` DNS + M365 rename:** C2.
- **Prismic account/token/webhook secret:** B3 (already an existing epic; input feeds SWBE-79/80).

## What a clean publish would actually create (when unblocked and conflicts resolved)

Only a small subset is genuinely new, unblocked, non-conflicting, and in-scope for the website spec tree:

- **B4** — personality slider → new REQ-029 (or fold under Culture) + one Story. Confirm dot positions with the designer before merge.
- **B6** — photo set → no REQ/DEC/ARCH (asset task); one Task, v1 = designer prototype photos.
- **A1** — BBH adoption → new **DEC-023 superseding DEC-008** (records BBH-on-Google-Fonts verified 2026-07-20, satisfies REQ-016) + one Story. Optionally a note that SWBE-43's "Archivo interim" is retired.
- *(optional)* **A3** — clickable-pill contract → focused **REQ-029** + fold impl into SWBE-21/78.

Everything else is **fold** (A5→SWBE-78; B1→SWBE-21/22; B2→SWBE-21 after conflict #1; B3→SWBE-79/80/81), **hold-until-unblocked** (A2, A4, A6, C1, C2, D1–D5), or **conflict-gated** (B2, B3, C1).

## Recommended next step

The `/bigemotion-spec` skill is one-description-per-invocation; this backlog is not a single change. When ready, drive it **one clean item at a time** (A1, then B4, then B6…), each as its own gated pass, after the owner resolves the three conflicts and supplies the vector logo + owed inputs. Fold the duplicates directly onto their open SWBE tickets via the Jira UI rather than through this skill.

## Publish log

**2026-07-21 — A1, B4, B6 published** (the clean, unblocked, non-conflicting subset), all Confluence sections at status `Pending` for owner review:

| Item | Confluence | Jira |
|---|---|---|
| A1 | `DEC-023` NEW (Decisions, supersedes `DEC-008`); `DEC-008` retirement entry on the Obsolete page; `REQ-016` satisfied (untouched) | Story **SWBE-90** |
| B4 | `REQ-029` NEW (Requirements) — note this consumed REQ-029, so the optional A3 contract above would be the next free REQ | Story **SWBE-92** |
| B6 | none (asset task) | Task **SWBE-91** |

**B2 (i18n FR-default) also published 2026-07-21** — spec-only reversal, no new ticket, folded onto SWBE-21: `DEC-024` (Decisions, supersedes `DEC-010`), `REQ-030` (Requirements, supersedes `REQ-014`), `ARCH-017` (Architecture, supersedes `ARCH-010`), each linking SWBE-21; the three retired sections received Obsolete-page entries. **Two follow-ups on approval:** (1) `ARCH-016` still text-references the retired `ARCH-010` in its body — repoint it to `ARCH-017`; (2) SWBE-21's description still reads "routed FR/EN (next-intl)" with no direction — the implementer must follow REQ-030/DEC-024/ARCH-017 (FR-default). Neither was auto-edited (append-only + no editing existing tickets).

**C1, C2, A6 also published 2026-07-21** as tracked tickets with owner preconditions documented in each ticket:
- **C1** → `DEC-025` + `REQ-031` (Requirements; `REQ-031` **supersedes `REQ-024`**, retired to Obsolete) + Story **SWBE-93**. Precondition: create the `hello@` mailbox/alias in M365.
- **C2** → `DEC-026` + `REQ-032` + Story **SWBE-94** (cross-repo). Preconditions: support-portal repo URL, M365 `support@`→`b2b@`, `b2b.` DNS.
- **A6** → `REQ-033` + Story **SWBE-95**. Precondition: confirmed social profile URLs.

Follow-up on approval: `ARCH-014` / `ARCH-015` still carry stale `contact@` recipient / `espace@` sender details — repoint them to the per-purpose model of REQ-031/DEC-025 (append-only, not auto-edited; no new ARCH created here for KISS).

Still open: **A2, A4, D1–D5** blocked on the non-existent vector logo. Duplicates (A5, B1, B3) fold onto SWBE-78 / SWBE-21+22 / SWBE-79+80+81 via the Jira UI — no new tickets.
