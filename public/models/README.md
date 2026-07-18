# 3D models

## scene.glb

Draco-compressed glTF 2.0 scene loaded by the Three.js hero canvas (Revamp 2, SWBE-20).

**Current state:** placeholder empty glTF scene committed so the pipeline (GLTFLoader +
DRACOLoader wired to `/draco/`) is testable before the designer delivers the final asset.
Replace `scene.glb` with the production model following the command below.

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
