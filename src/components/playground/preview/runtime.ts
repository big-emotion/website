// The gallery previews' WebGL runtime. This module is the whole reason the previews are
// affordable: `card-preview.tsx` only ever reaches it through `await import(...)`, from
// inside a hover handler, so three.js, the Draco decoder and the GLB stay out of the
// gallery's initial payload and arrive when a visitor first asks to see one.
//
// Loading it once is enough for every card — the decoded rig is memoised here and
// cloned per card, sharing geometry on the GPU. Each card still owns its renderer (a
// WebGL context cannot be shared across canvases) and its own PMREM environment, which
// is generated per renderer.

import * as THREE from "three";
import { CAMERA } from "@/components/scene/states";
import { buildStudioEnvironment, loadStudioRig } from "@/components/scene/studio-rig";
import { DROP_FLOOR, DROP_REST_HEIGHT, dropHeight, pointerYawPitch } from "./motion";

/** Which sample of its effect a card plays. One per registered effect (see effects.ts). */
export type PreviewMotion = "orient" | "drop";

export type CardPreview = {
  /** Pointer entered or the card took keyboard focus: start playing. */
  activate: () => void;
  /** Pointer left or focus moved on: return to the rest pose and stop rendering. */
  deactivate: () => void;
  /** Pointer position within the card, each axis −1..1. Only "orient" reads it. */
  track: (nx: number, ny: number) => void;
  dispose: () => void;
};

// A card is a fraction of the viewport, so the hero's framing would leave the mark a
// thumbnail inside it. These bring it up to roughly the width the flat lockup occupies
// underneath, so the cross-fade swaps one for the other rather than shrinking it.
const PREVIEW_CAMERA_DISTANCE = 1.9;
const PREVIEW_MARK_SCALE = 1.25;
/** How fast the mark eases towards the pointer, and back to face-on when it leaves. */
const ORIENT_SMOOTHING_PER_S = 7;
/** Tumble the falling mark picks up, radians per second. */
const DROP_TUMBLE_RAD_PER_S = 1.6;

let sharedRig: Promise<THREE.Group> | null = null;

/** Decodes the branded GLB once for the whole gallery; every card clones the result. */
function loadSharedRig(): Promise<THREE.Group> {
  sharedRig ??= new Promise<THREE.Group>((resolve, reject) => {
    loadStudioRig(resolve, () =>
      reject(new Error("Playground preview: studio rig failed to load")),
    );
  });
  return sharedRig;
}

/**
 * Mounts one card's preview into `container`. Resolves once the rig is on screen in its
 * rest pose; rejects if the GLB never arrives, which the caller treats as "keep the
 * typographic vignette" rather than as an error worth showing anyone.
 */
export async function createCardPreview(
  container: HTMLElement,
  motion: PreviewMotion,
): Promise<CardPreview> {
  const rig = await loadSharedRig();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CAMERA.fov,
    container.clientWidth / Math.max(1, container.clientHeight),
    CAMERA.near,
    CAMERA.far,
  );
  camera.position.set(0, 0, PREVIEW_CAMERA_DISTANCE);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  // Capped harder than the effects themselves: three of these can be live at once and a
  // card is a fraction of the viewport, so retina-doubling them buys nothing visible.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const environment = pmrem.fromScene(buildStudioEnvironment(), 0.02);
  scene.environment = environment.texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.0);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));

  // Shares geometry with the other cards' clones; materials are cloned so a card can
  // tint or fade its own mark without the change leaking onto its neighbours.
  const mark = rig.clone(true);
  const ownedMaterials: THREE.Material[] = [];
  mark.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    const material = (mesh.material as THREE.MeshStandardMaterial).clone();
    mesh.material = material;
    ownedMaterials.push(material);
  });

  const spin = new THREE.Group();
  spin.scale.setScalar(PREVIEW_MARK_SCALE);
  spin.add(mark);
  scene.add(spin);

  const pointer = { x: 0, y: 0 };
  let active = false;
  let elapsedS = 0;

  function restPose() {
    elapsedS = 0;
    pointer.x = 0;
    pointer.y = 0;
    spin.rotation.set(0, 0, 0);
    spin.position.y = motion === "drop" ? DROP_REST_HEIGHT : 0;
  }

  function step(deltaS: number) {
    elapsedS += deltaS;

    if (motion === "orient") {
      const { yaw, pitch } = pointerYawPitch(pointer.x, pointer.y);
      // Framerate-independent easing, so the mark trails the pointer by the same amount
      // on a 60Hz laptop and a 120Hz display.
      const catchUp = 1 - Math.exp(-ORIENT_SMOOTHING_PER_S * deltaS);
      spin.rotation.y += (yaw - spin.rotation.y) * catchUp;
      spin.rotation.x += (pitch - spin.rotation.x) * catchUp;
      return;
    }

    const height = dropHeight(elapsedS);
    spin.position.y = height;
    // The tumble stops with the fall rather than spinning on where it landed.
    if (height > DROP_FLOOR + 0.001) spin.rotation.z -= DROP_TUMBLE_RAD_PER_S * deltaS;
  }

  /** True once the card's gesture has played out and nothing will change again. */
  function settled(): boolean {
    if (motion === "orient") return false; // it follows the pointer for as long as it stays
    return dropHeight(elapsedS) <= DROP_FLOOR + 0.001;
  }

  const clock = new THREE.Clock();
  let frame = 0;

  function renderLoop() {
    const deltaS = Math.min(clock.getDelta(), 0.05);
    step(deltaS);
    renderer.render(scene, camera);

    // Holding a finished pose costs nothing but a stopped loop; three idle previews
    // repainting an unchanging frame would not.
    if (active && !settled()) {
      frame = requestAnimationFrame(renderLoop);
    } else {
      frame = 0;
    }
  }

  function start() {
    if (frame !== 0) return;
    clock.getDelta(); // discard the gap since the last activation
    frame = requestAnimationFrame(renderLoop);
  }

  function stop() {
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
  }

  const onResize = () => {
    camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (!active) renderer.render(scene, camera);
  };
  window.addEventListener("resize", onResize);

  restPose();
  renderer.render(scene, camera);

  return {
    activate() {
      active = true;
      elapsedS = 0;
      clock.getDelta();
      start();
    },
    deactivate() {
      active = false;
      stop();
      restPose();
      renderer.render(scene, camera);
    },
    track(nx, ny) {
      pointer.x = nx;
      pointer.y = ny;
      // Re-arm the loop: "orient" never settles, but a pointer that re-enters after the
      // loop stopped for another reason still has to be followed.
      if (active) start();
    },
    dispose() {
      active = false;
      stop();
      window.removeEventListener("resize", onResize);
      environment.texture.dispose();
      pmrem.dispose();
      ownedMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    },
  };
}
