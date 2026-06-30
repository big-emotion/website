<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BIG EMOTION website

Static marketing site for the BIG EMOTION agency. Migrated off WordPress/Divi.

Hard constraints:
- **Static export** (`output: "export"`): no SSR, no API routes, no server-only
  features. The build must produce `out/`. Anything dynamic goes to `contact.php`
  on n0c or a client-side approach.
- Mobile-first. Design follows `brand/big-emotion-brand-guidelines.pdf` and the
  tokens in `src/app/globals.css`.
- Keep it KISS. Run `pnpm lint && pnpm test && pnpm build` before committing.
- All docs/comments in English. See `docs/adr/0001-static-nextjs-on-n0c.md`.
