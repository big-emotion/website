# Draco WASM decoder

These files are vendored from `three` v0.185.1 (`three/examples/jsm/libs/draco/gltf/`).
The GLTFLoader's `DRACOLoader` reads Draco-compressed meshes from `public/models/scene.glb`
by pointing at this directory.

## Files

| File | Description |
|------|-------------|
| `draco_decoder.wasm` | WebAssembly binary — fast path for modern browsers |
| `draco_wasm_wrapper.js` | JS wrapper that loads the WASM module |
| `draco_decoder.js` | Pure-JS fallback decoder (no WASM) |

## How to update

Run this command from the repo root after upgrading the `three` package:

```bash
cp node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm \
   node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js \
   node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js \
   public/draco/
```

Commit the result and update the version reference above.
