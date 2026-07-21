# 0007 — Routed FR/EN locales with French as the unprefixed default

- Status: accepted
- Date: 2026-07-21

## Context

The site shipped monolingual: `<html lang="fr">` hardcoded in the root layout,
French marketing copy inlined in `src/content/site.ts`, one indexable URL.

The revamp epic (SWBE-18) originally planned a client-side FR/EN toggle
persisted in `localStorage`, because `output: "export"` made Next's i18n routing
impossible. ADR 0005 replaced the static export with a standalone server build,
which removed that constraint — routed locales became available, and the
client-side toggle was superseded.

Which locale gets the bare `/` was then decided twice, in opposite directions.
The first answer (Confluence DEC-010 / REQ-014 / ARCH-010, and the body of
SWBE-21) was `defaultLocale: "en"`, putting English at `/` and French under
`/fr/…`. The owner reversed it: DEC-024 / REQ-030 / ARCH-017 mark that chain
superseded and require French at `/`, English at `/en/…`. SWBE-21's closing line
("the implementer must follow the FR-default spec") points at the reversal, so
the ticket description contradicts itself and the Confluence spec wins.

The reversal is also the only option that does not break the live site. Every
URL Google has indexed for `big-emotion.com` is French and lives at the root,
and the eight legacy WordPress 301s in `next.config.ts` all target French pages.
EN-default would have moved the entire existing site under `/fr/`.

## Decision

- **next-intl with routed locales**: `locales: ["fr", "en"]`,
  `defaultLocale: "fr"`, `localePrefix: "as-needed"` — `/` is French with no
  prefix, `/en/…` is English. Config in `src/i18n/routing.ts`.
- **`localeDetection: false`.** next-intl otherwise reads `Accept-Language` and
  a `NEXT_LOCALE` cookie and redirects `/` to `/en` for an English-preferring
  browser. Language here is a URL decision, not a negotiation: `/` must always
  serve French. This also keeps the SSG homepage cacheable, since no
  per-visitor cookie is set on the way through.
- **Copy stays in `src/content/site.ts`**, restructured to `content[locale]`,
  with locale-invariant data (contact details, client roster, personality axes)
  at module level. `messages/{fr,en}.json` carries UI affordances only — aria
  labels, form microcopy, the skip link. This inverts the sibling
  chancellerie project's convention on purpose: there, page chrome never lives
  in i18n files; here, `site.ts` is the content authority (AGENTS.md) and the
  message catalogue is the subordinate one.
- **Locale routing lives in `src/proxy.ts`**, composed with the pre-existing
  `/espace` session guard. Next.js 16 allows exactly one proxy file, so the two
  concerns share it: `/espace`, `/login`, `/logout`, `/verify` and `/api` branch
  out before next-intl runs. The authenticated surface stays French-only and
  outside `[locale]`, per REQ-030 — it must never be rewritten to `/fr/login`.
- **Section anchors become real routes.** `/approach/`, `/cases/`, `/culture/`,
  `/contact/` exist in both locales (REQ-015). The home page became six
  full-viewport scene panels that carry headline copy only, so the detail
  content had nowhere to live and the `/#approach` anchors it was reached
  through no longer exist. The legacy 301 destinations were repointed from those
  dead anchors to the routes that now hold that content; the `source` URLs and
  their `permanent: true` are untouched.

## Consequences

- **No single root layout.** `[locale]` is a top-level dynamic segment, so
  `<html lang>` must be decided inside it. `src/app/layout.tsx` is gone;
  `src/app/[locale]/layout.tsx` and `src/app/(auth)/layout.tsx` each own an
  `<html>`/`<body>` and share `src/app/document-shell.tsx`. A third root layout
  will be needed when `/espace` grows pages.
- **`setRequestLocale(locale)` is mandatory** in every page and layout under
  `[locale]`, before any other next-intl call. Omit it and next-intl falls back
  to reading `headers()`, which drops that route out of SSG — silently, since
  the build still succeeds.
- **`next.config.ts` must stay wrapped in `createNextIntlPlugin()`**, and the
  wrapped object must be the one carrying `trailingSlash: true`: the plugin
  copies that flag into an env var the middleware reads when normalising its
  redirects. Wrapping a bare object instead produces an extra redirect hop on
  every locale switch.
- **Two hreflang mechanisms are active.** next-intl's middleware emits a `Link:`
  response header with `rel="alternate"`, and `generateMetadata` emits `<link>`
  tags from `alternates.languages`. Both are valid and they agree, because
  `src/i18n/urls.ts` normalises trailing slashes on the metadata side —
  next-intl's own `getPathname()` does not apply `trailingSlash` unless
  localized `pathnames` are configured. Any new advertised URL (canonical, OG,
  sitemap) must go through those helpers.
- English marketing copy is newly authored rather than translated from a source
  of record. The six scene headlines and the subpage intros come from the
  designer's preview dictionary (`js/i18n.js`), which is authoritative; the
  detail sections — services, sector cases, productions, team bios, values —
  had no English counterpart and were written for this change.
- The display-font ASCII constraint (DEC-023) now applies to French headline
  copy that previously did not exist: BBH Hegarty has no accented glyphs, so
  scene titles and nav labels are written unaccented. Body copy keeps correct
  French. `src/content/site.test.ts` enforces the split per locale.
- Supersedes SWBE-18's locked decision 5 (client-side toggle) and the EN-default
  chain DEC-010 / REQ-014 / ARCH-010. ADR 0005's standalone build is a
  prerequisite and stands unchanged.
