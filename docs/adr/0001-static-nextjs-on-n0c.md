# 0001 — Static Next.js export, hosted on the existing n0c host

- Status: accepted
- Date: 2026-06-30

## Context

The previous site was WordPress + the Divi page builder on n0c shared hosting
(PHP 7.4, no Node). Content is tiny (≈5 pages, ~50 MB media) and changes rarely.
The owner wants to modernise the stack and drop WordPress, but keep editing simple
and avoid a hosting/DNS migration if possible.

## Decision

- Rebuild as a **Next.js App Router** app exported to **static HTML**
  (`output: "export"`). No server-side rendering, no API routes.
- **Content lives in the repo** (typed modules now, MDX for long-form later).
  WordPress is removed entirely — no headless CMS.
- **Host the `out/` export on the current n0c host.** Apache/LiteSpeed serves the
  static files; `trailingSlash: true` mirrors the old WordPress URL shape so
  existing links and SEO keep resolving.
- The contact form posts to a small `contact.php` on n0c (the one piece of
  server code we keep), avoiding a third-party form service.

## Consequences

- Publishing a content change = rebuild + redeploy (no live editing). Acceptable
  given how rarely the content changes; a non-dev can still edit text via GitHub's
  web editor, which triggers the deploy.
- No WordPress to patch, secure, or update — smaller attack surface, lower cost.
- `next/image` runtime optimisation is unavailable under static export; images are
  served as authored (`images.unoptimized = true`).
- If we later need dynamic features, we revisit (move to Vercel or add PHP/serverless
  endpoints).
