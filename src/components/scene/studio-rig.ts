// The "studio rig": the chrome wordmark's studio lighting and branded chrome
// material, extracted so every Playground effect (SWBE-210) mounts the exact same
// branded asset instead of re-deriving its own — the "one logo, one core" rule
// (ARCH-019). Moved out of scene-canvas.tsx as-is (SWBE-211); no behavior changed.

import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MATERIAL } from "./states";

export const GLB_URL = "/models/scene.glb";
export const DRACO_DECODER_PATH = "/draco/";

/** Chrome studio lighting, procedurally baked into an environment map so the
 *  wordmark reflects light streaks without shipping an HDRI asset. */
export function buildStudioEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x565b64);
  const panel = (
    w: number,
    h: number,
    intensity: number,
    pos: [number, number, number],
    rot?: [number, number, number],
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(intensity) }),
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    env.add(mesh);
    return mesh;
  };
  panel(14, 10, 5.0, [0, 6, 6], [-Math.PI / 3, 0, 0]);
  panel(1.6, 16, 9.0, [-8, 2, 3], [0, Math.PI / 3.2, 0]);
  panel(1.2, 16, 8.0, [8, 3, -1], [0, -Math.PI / 3.2, 0]);
  panel(16, 3, 3.0, [0, -6, 4], [Math.PI / 3, 0, 0]);
  const fill = panel(20, 20, 0.9, [0, 0, -12], [0, 0, 0]);
  (fill.material as THREE.MeshBasicMaterial).color.setRGB(0.55, 0.6, 0.72);
  return env;
}

/**
 * Decodes the Draco-compressed branded wordmark GLB, applies the shared chrome
 * material to every mesh, and centers/normalizes it into a unit-scaled holder group
 * ready to be added to a scene. `onReady` fires once with that holder; `onError`
 * fires if the load fails (e.g. WebGL unavailable never reaches this, but a bad
 * network fetch does).
 */
export function loadStudioRig(onReady: (holder: THREE.Group) => void, onError: () => void): void {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load(
    GLB_URL,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.metalness = MATERIAL.metalness;
        material.roughness = MATERIAL.roughness;
        material.envMapIntensity = MATERIAL.envMapIntensity;
        material.color = new THREE.Color(0xffffff);
        material.needsUpdate = true;
      });

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      const holder = new THREE.Group();
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      holder.scale.setScalar(1 / maxDim);
      // The shipped GLB carries a +45° Y rotation on a node (designer export);
      // cancel it here so STATES face-on keyframes actually face the camera.
      // Must live on holder: applyLive() overwrites spin.rotation every frame.
      holder.rotation.y = -Math.PI / 4;
      holder.add(model);

      onReady(holder);
    },
    undefined,
    onError,
  );
}
