// The PG-21 lifecycle contract for a Playground effect module: `mount`/`reset`/
// `setQualityTier`/`dispose`. The registry (effects.ts) only ever renders a plain
// React component — nothing calls these from outside — so `index.tsx` is the sole
// caller, invoking them from its own mount/unmount effect. Splitting the imperative
// Three.js/physics engine out of the component (mirroring the studio-rig extraction,
// ARCH-019) keeps it unit-testable without a renderer.

import * as THREE from "three";
import { CAMERA } from "@/components/scene/states";
import { buildStudioEnvironment, loadStudioRig } from "@/components/scene/studio-rig";
import {
  CAMERA_DISTANCE_DEFAULT,
  clampCameraDistance,
  frameDelta,
  stepCameraDistance,
  isAtRest,
  isThrow,
  reflectOffWalls,
  sampleVelocity,
  stepMotion,
  stepTorque,
  type Bounds,
  type PointerSample,
  type Vec2,
} from "./physics";
import { reportInteraction } from "@/components/playground/report-interaction";
import type { ZoomDirection } from "@/components/playground/zoom-controls";

export type QualityTier = "high" | "low";

export type PoidsLourdEngineOptions = {
  /** Registered id passed to `reportInteraction` (defaults to "poids-lourd"). */
  effectId?: string;
  /** -1..1 per axis, polled every frame; defaults to no bias when tilt isn't granted. */
  getTiltBias?: () => Vec2;
};

export type PoidsLourdEngine = {
  mount: (container: HTMLElement) => void;
  reset: () => void;
  /** One press of the on-screen zoom control — the only zoom a trackpad or a touchscreen
   *  can reach, since the wheel gesture needs a mouse button held at the same time. */
  zoom: (direction: ZoomDirection) => void;
  setQualityTier: (tier: QualityTier) => void;
  dispose: () => void;
};

const GRAVITY = -9.8;
const RADIUS = 0.5;
const RESTITUTION = 0.65;
const REST_SPEED = 0.05;
const THROW_SPEED = 1.5;
const TORQUE_DAMPING = 0.8;
const SAMPLE_HISTORY_MS = 200;
// The shared studio rig's field of view (PG-26) — the toy had its own 50°, which framed
// the same logo smaller than the home hero and the two other effects do.
const FOV_DEGREES = CAMERA.fov;
// One notch of the wheel is ~100 deltaY, so this dollies about a third of a world unit
// per notch: enough to feel immediate, gentle enough to land on a framing you meant.
const DOLLY_SENSITIVITY = 0.003;
// A trackpad pinch reaches the page as a wheel event too, but with deltas an order of
// magnitude smaller than a wheel notch — at the wheel's own sensitivity a full pinch
// would barely shift the framing.
const PINCH_SENSITIVITY = 0.024;

// The walls are the viewport edges, so they move with the camera — every dolly has to
// recompute them or the logo would bounce off nothing, or off the frame's outside.
function computeBounds(aspect: number, cameraDistance: number): Bounds {
  const halfHeight = cameraDistance * Math.tan((FOV_DEGREES * Math.PI) / 360);
  const halfWidth = halfHeight * aspect;
  return { minX: -halfWidth, maxX: halfWidth, minY: -halfHeight, maxY: halfHeight };
}

export function createPoidsLourdEngine(options: PoidsLourdEngineOptions = {}): PoidsLourdEngine {
  const effectId = options.effectId ?? "poids-lourd";
  const getTiltBias = options.getTiltBias ?? (() => ({ x: 0, y: 0 }));

  let renderer: THREE.WebGLRenderer | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let container: HTMLElement | null = null;
  let body: THREE.Group | null = null;
  let cameraDistance = CAMERA_DISTANCE_DEFAULT;
  let bounds = computeBounds(1, cameraDistance);
  let slowMotion = false;

  let position: Vec2 = { x: 0, y: 0 };
  let velocity: Vec2 = { x: 0, y: 0 };
  let angle = 0;
  let angularVelocity = 0;
  let held = false;
  let history: PointerSample[] = [];
  let wasBounced = false;

  const cleanupFns: Array<() => void> = [];

  function screenToWorld(clientX: number, clientY: number): Vec2 {
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
    return { x: nx * bounds.maxX, y: -ny * bounds.maxY };
  }

  function onPointerDown(event: PointerEvent) {
    // Secondary button = the slow-motion hold, not a grab. Keeping the two on separate
    // buttons is what lets a visitor slow the toy down *while* it is in flight.
    if (event.button === 2) {
      slowMotion = true;
      return;
    }
    if (event.button !== 0) return;

    held = true;
    velocity = { x: 0, y: 0 };
    const world = screenToWorld(event.clientX, event.clientY);
    history = [{ x: world.x, y: world.y, t: event.timeStamp }];
    reportInteraction(effectId, "grab");
  }

  function onWheel(event: WheelEvent) {
    // A bare wheel is left to the page on purpose: the stage fills most of the viewport,
    // so swallowing every wheel event is what trapped visitors with no way back to the
    // header. It dollies while a mouse button is held (grab or slow-motion) or under a
    // pinch, which every browser delivers as a wheel event with `ctrlKey` set — the
    // gesture a trackpad can actually make. Ctrl/Cmd + wheel rides the same branch for
    // mouse users, and page zoom stays available from the keyboard.
    const pinching = event.ctrlKey || event.metaKey;
    if (!held && !slowMotion && !pinching) return;
    event.preventDefault();
    const sensitivity = pinching ? PINCH_SENSITIVITY : DOLLY_SENSITIVITY;
    cameraDistance = clampCameraDistance(cameraDistance + event.deltaY * sensitivity);
    applyCameraDistance();
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  function applyCameraDistance() {
    if (!camera || !container) return;
    camera.position.z = cameraDistance;
    const rect = container.getBoundingClientRect();
    bounds = computeBounds(rect.width / rect.height || 1, cameraDistance);
  }

  function onPointerMove(event: PointerEvent) {
    if (!held) return;
    const world = screenToWorld(event.clientX, event.clientY);
    history.push({ x: world.x, y: world.y, t: event.timeStamp });
    const cutoff = event.timeStamp - SAMPLE_HISTORY_MS * 2;
    history = history.filter((sample) => sample.t >= cutoff);
    // Grab spin: the faster the drag, the more it winds up the core (ARCH-019 "core torque").
    angularVelocity += (world.x - position.x) * 0.5;
    position = world;
  }

  function onPointerUp(event: PointerEvent) {
    if (event.button === 2) {
      slowMotion = false;
      return;
    }
    if (!held) return;
    held = false;
    const world = screenToWorld(event.clientX, event.clientY);
    history.push({ x: world.x, y: world.y, t: event.timeStamp });
    velocity = sampleVelocity(history, SAMPLE_HISTORY_MS);
    if (isThrow(velocity, THROW_SPEED)) reportInteraction(effectId, "throw");
  }

  function onResize() {
    if (!container || !renderer || !camera) return;
    const rect = container.getBoundingClientRect();
    const aspect = rect.width / rect.height || 1;
    bounds = computeBounds(aspect, cameraDistance);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
  }

  function tick(dt: number) {
    if (held) {
      // Kinematic while grabbed: `onPointerMove` already wrote `position` directly, so
      // there's no gravity/wall integration to run — only the torque below still ticks.
    } else {
      const tilt = getTiltBias();
      const stepped = stepMotion(
        position,
        velocity,
        { x: tilt.x * 4, y: GRAVITY + tilt.y * 4 },
        dt,
      );
      const reflected = reflectOffWalls(
        stepped.position,
        stepped.velocity,
        bounds,
        RADIUS,
        RESTITUTION,
      );
      position = reflected.position;
      velocity = isAtRest(reflected.velocity, REST_SPEED) ? { x: 0, y: 0 } : reflected.velocity;

      if (reflected.bounced && !wasBounced) reportInteraction(effectId, "bounce");
      wasBounced = reflected.bounced;
    }

    const torque = stepTorque(angle, angularVelocity, TORQUE_DAMPING, dt);
    angle = torque.angle;
    angularVelocity = torque.angularVelocity;

    if (body) {
      body.position.set(position.x, position.y, 0);
      body.rotation.set(0, 0, angle);
    }
  }

  return {
    mount(el: HTMLElement) {
      container = el;

      const scene = new THREE.Scene();
      const rect = el.getBoundingClientRect();
      const aspect = rect.width / rect.height || 1;
      bounds = computeBounds(aspect, cameraDistance);

      camera = new THREE.PerspectiveCamera(FOV_DEGREES, aspect, CAMERA.near, CAMERA.far);
      camera.position.set(0, 0, cameraDistance);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      el.appendChild(renderer.domElement);
      cleanupFns.push(() => {
        renderer?.dispose();
        if (renderer && el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      });

      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      scene.environment = pmrem.fromScene(buildStudioEnvironment(), 0.02).texture;

      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 4, 5);
      scene.add(key);
      // The rim was missing here while the home hero had it (PG-26), which is what left
      // the chrome's far edge unlit and flattened the logo against the backdrop.
      const rim = new THREE.DirectionalLight(0xffffff, 1.0);
      rim.position.set(-4, 2, -3);
      scene.add(rim);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));

      const timer = new THREE.Timer();
      const render = () => {
        timer.update();
        // `frameDelta` owns both the stall cap and the held-secondary-button slow motion.
        tick(frameDelta(timer.getDelta(), slowMotion));
        if (camera) renderer?.render(scene, camera);
      };

      loadStudioRig(
        (holder) => {
          body = holder;
          scene.add(holder);
        },
        () => {
          /* GLB fetch failed: the toy simply renders empty rather than crashing. */
        },
      );

      el.addEventListener("pointerdown", onPointerDown);
      // Not passive: the dolly owns the wheel over the stage, so it has to be able to
      // stop the page scrolling behind it.
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("contextmenu", onContextMenu);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("resize", onResize);
      cleanupFns.push(() => {
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("contextmenu", onContextMenu);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("resize", onResize);
      });

      renderer.setAnimationLoop(render);
      cleanupFns.push(() => renderer?.setAnimationLoop(null));
    },

    reset() {
      position = { x: 0, y: 0 };
      velocity = { x: 0, y: 0 };
      angle = 0;
      angularVelocity = 0;
      held = false;
      slowMotion = false;
      history = [];
      // The framing is part of the state a visitor can get lost in, so relaunching
      // restores it too rather than leaving them zoomed inside the mesh.
      cameraDistance = CAMERA_DISTANCE_DEFAULT;
      applyCameraDistance();
      body?.position.set(0, 0, 0);
      body?.rotation.set(0, 0, 0);
    },

    zoom(direction: ZoomDirection) {
      cameraDistance = stepCameraDistance(cameraDistance, direction);
      applyCameraDistance();
    },

    setQualityTier(tier: QualityTier) {
      renderer?.setPixelRatio(tier === "high" ? Math.min(window.devicePixelRatio, 2) : 1);
    },

    dispose() {
      cleanupFns.forEach((fn) => fn());
      cleanupFns.length = 0;
      renderer = null;
      camera = null;
      container = null;
      body = null;
    },
  };
}
