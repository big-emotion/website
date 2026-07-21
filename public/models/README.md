# 3D models

## scene.glb

Draco-compressed glTF 2.0 scene loaded by the Three.js hero canvas (Revamp 2, SWBE-20).

**Current state:** the designer's production logo model (`BE-logo-3D.min.glb`, 45,592 B,
single white-chrome material) — the exact asset the reference prototype at
bigemotion.netlify.app serves. The master (`BE-3d.glb`, 7.1 MB, non-indexed, uncompressed)
lives outside the repo with the brand sources. It replaced the 92-byte placeholder in
SWBE-78.

**Gotcha:** the asset carries a +45° Y rotation on a node. `scene-canvas.tsx` cancels it
with `holder.rotation.y = -Math.PI / 4` on the normalization holder — keep that in sync
if the model is re-exported. The correction must stay on the holder group: `applyLive()`
rewrites `spin.rotation` every frame and would silently clobber it.

## The placeholder-vs-real gate (DEC-027)

`GLTFLoader` succeeded on the old placeholder exactly as it does on a real model, so the
hero's "ready" state could never be trusted to mean "there is something to look at".
`src/components/scene/model-gate.ts` exports `HAS_HERO_MODEL`, the single source of truth
for whether a real model ships:

- **`false`**: the hero renders the static `<Wordmark>` and the Three.js/GSAP/Lenis
  runtime is never fetched — `SceneMount` (`src/components/scene/scene-mount.tsx`) never
  even triggers the dynamic import that would pull `scene-canvas.tsx` into the bundle.
- **`true`** (current state): `SceneMount` dynamically imports `scene-canvas.tsx`, which
  then loads this file and runs the full scroll-driven reveal.

The SWBE-78 hand-off is done — the production model landed and the flag was flipped in the
same commit. Flip it back to `false` if this file ever regresses to a placeholder: a `true`
gate with nothing to render costs the ~203 KB gzip payload to draw an empty canvas, which
is exactly what DEC-027 removed.

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
