# 0005 — Motion/3D stack: Three.js imperative, no react-three-fiber, self-hosted Draco

- Status: accepted
- Date: 2026-07-18
- Relates to: SWBE-18 (epic), SWBE-19 (story)

## Context

The BIG EMOTION hero section will feature a 3D scene (Revamp 2, SWBE-20). The site
is a Next.js static export (`output: "export"`, ADR 0001) with no server-side code.
We need a 3D rendering approach that:

1. works with static export (no SSR, no API routes),
2. keeps bundle size controlled for a one-page marketing site,
3. loads a compressed GLB model efficiently on mobile,
4. stays consistent with the KISS principle already applied to the rest of the stack.

A preview prototype was built before this ADR to evaluate the options.

## Decision

### Three.js — yes, imperative module, pinned at 0.185.1

Three.js is added as a **pinned runtime dependency** (`three@0.185.1`,
`@types/three@0.185.1` as a dev dependency). The scene is implemented as a
**single imperative module** (a plain TypeScript file that initialises a
`WebGLRenderer`, loads the GLB via `GLTFLoader`, and attaches to a canvas element).
No declarative abstraction layer is added.

### react-three-fiber — rejected

react-three-fiber (r3f) was prototyped and **rejected**. The scene is one self-contained
canvas that doesn't need to share state with the React tree; r3f's reconciler adds a
layer of abstraction (and ~50 kB) the preview proved unnecessary. KISS: use the tool
that matches the scope, not the framework ecosystem.

### Draco decoder — self-hosted under `public/draco/`

The Three.js `DRACOLoader` requires the Draco WASM decoder files to be served at a
known URL. We copy them from `node_modules/three/examples/jsm/libs/draco/gltf/` into
`public/draco/` and commit them. This avoids a CDN dependency (Google's CDN is the
default in most tutorials), keeps the build offline-reproducible, and means the
static export always ships the decoder it was built against. Update procedure is
documented in `public/draco/README.md`.

### Display font — Archivo Variable as BBH stand-in

The brand guidelines reference a custom display typeface (BBH). The designer's license
review (epic precondition 2) has not delivered a self-hostable font file. Archivo
Variable (`archivo-latin.woff2`, already committed in `src/app/fonts/`) is an
open-licensed grotesque with the same weight axis (100–900) that matches the brand
aesthetic closely enough to unblock Revamp 2. The `--font-display` CSS token
(`src/app/globals.css`) already resolves to it via `--font-bbh`; no change to the
token is needed. If the license resolves and a BBH file is delivered, only
`src/app/fonts/` and the `localFont` call in `src/app/layout.tsx` need updating —
the token chain stays unchanged.

## Consequences

- `three` and `@types/three` are now dependencies; `pnpm-lock.yaml` is updated.
- `public/draco/` (≈ 750 kB) is committed and served verbatim by the static export.
  This is a one-time cost; the decoder does not change between Three.js patch releases.
- `public/models/scene.glb` is a placeholder empty glTF scene; it must be replaced
  with the production Draco-compressed model before Revamp 2 ships. Regeneration
  command is documented in `public/models/README.md`.
- UI animations outside the 3D canvas remain CSS-only (no animation library). The
  3D scene is the single exception, recorded here.
- When the real model asset is available: compress with `gltf-pipeline --draco.*` and
  drop the result into `public/models/scene.glb`.
