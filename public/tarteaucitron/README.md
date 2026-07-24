# tarteaucitron.js — cookie consent manager

Vendored from [`tarteaucitronjs`](https://github.com/AmauriC/tarteaucitron.js) **v1.34.0** (MIT,
see `LICENSE`). Serving it from `public/` rather than importing it through the bundler is not a
preference: the library resolves its own stylesheet, language file and service catalogue
*relative to its `<script src>`*, so it has to sit on disk in this exact shape.

Self-hosted for the same reason the fonts are (`src/app/fonts/`): a consent manager that
fetches itself from a third-party CDN would report the visitor to that CDN before the visitor
has consented to anything.

## Files

| File | Description |
|------|-------------|
| `tarteaucitron.min.js` | The library. Entry point; everything below is loaded by it |
| `tarteaucitron.services.min.js` | Catalogue of pre-written service definitions (GA, YouTube, …) |
| `css/tarteaucitron.min.css` | Banner and panel styles |
| `lang/tarteaucitron.{fr,en}.min.js` | The two languages this site routes |

The `.min.` in the filename is load-bearing: the library greps its own path for it to decide
whether to request minified assets for the rest.

Only the two languages the site serves are vendored. Adding a locale to `src/i18n/locales.ts`
means copying its language file here too.

## How this site uses it

Loaded **on demand** — nothing is fetched until a visitor opens cookie settings from the
footer. That is correct only while no script needs consent before it runs: the site sets
strictly-necessary cookies and nothing else, so there is no banner to show anyone.

**Adding the first consent-gated script (analytics, an embed, a pixel) changes that.** It has
to be registered as a tarteaucitron service *and* the library has to load eagerly on every
page, or it cannot hold the script back until consent is given. See
`src/components/consent/consent-manager.ts`.

## How to update

```bash
pnpm dlx tarteaucitronjs@<version> --help >/dev/null 2>&1 || true   # populates the pnpm store
cp node_modules/.pnpm/tarteaucitronjs@<version>/node_modules/tarteaucitronjs/tarteaucitron.min.js \
   node_modules/.pnpm/tarteaucitronjs@<version>/node_modules/tarteaucitronjs/tarteaucitron.services.min.js \
   public/tarteaucitron/
```

Then refresh `css/` and `lang/` the same way, and update the version above. Check the upstream
changelog for renamed `init()` parameters — they are not versioned separately.
