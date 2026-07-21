# 3D models

## scene.glb

Draco-compressed glTF 2.0 scene loaded by the Three.js hero canvas (Revamp 2, SWBE-20).

**Current state:** placeholder empty glTF scene (92 bytes) committed so the pipeline
(GLTFLoader + DRACOLoader wired to `/draco/`) is testable before the designer delivers the
final asset. `GLTFLoader` succeeds on this placeholder just like it would on a real model —
loading it is not itself a signal that a real model shipped. Replace `scene.glb` with the
production model following the command below.

## The placeholder-vs-real gate (DEC-027)

Because the placeholder loads successfully, the hero's "ready" state can't be trusted to
mean "there is something to look at". `src/components/scene/model-gate.ts` exports
`HAS_HERO_MODEL`, the single source of truth for whether a real model ships:

- **`false`** (current state, while this file is the placeholder): the hero renders the
  static `<Wordmark>` and the Three.js/GSAP/Lenis runtime is never fetched — `SceneMount`
  (`src/components/scene/scene-mount.tsx`) never even triggers the dynamic import that
  would pull `scene-canvas.tsx` into the bundle.
- **`true`**: `SceneMount` dynamically imports `scene-canvas.tsx`, which then loads this
  file and runs the full scroll-driven reveal.

**SWBE-78 hand-off:** once the production model replaces this placeholder, flip
`HAS_HERO_MODEL` to `true` in `model-gate.ts`. That one-line change is the entire gate —
no other file needs to change. Never flip it before a real model is committed here; doing
so brings back the ~203 KB gzip Three.js/GSAP/Lenis payload to render an empty canvas,
which is exactly what DEC-027 removed.

## How to regenerate after a model update

Prerequisites: `npm install -g gltf-pipeline` (or use `npx gltf-pipeline`).

```bash
# Compress source model with Draco (adjust input path as needed)
npx gltf-pipeline \
  -i assets/source/scene-source.glb \
  -o public/models/scene.glb \
  --draco.compressMeshes \
  --draco.compressionLevel 7
```

Verify compression ratio before committing:

```bash
ls -lh assets/source/scene-source.glb public/models/scene.glb
```

The Draco-compressed output should be 60–80% smaller than the source for typical hero
geometry. Commit the compressed `public/models/scene.glb`; the source file lives outside
the repo (large binary, provided by the designer).
