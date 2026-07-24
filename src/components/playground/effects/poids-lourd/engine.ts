// The PG-21 lifecycle contract for a Playground effect module: `mount`/`reset`/
// `setQualityTier`/`dispose`. The registry (effects.ts) only ever renders a plain
// React component — nothing calls these from outside — so `index.tsx` is the sole
// caller, invoking them from its own mount/unmount effect. Splitting the imperative
// Three.js/physics engine out of the component (mirroring the studio-rig extraction,
// ARCH-019) keeps it unit-testable without a renderer.

import * as THREE from "three";
import { buildStudioEnvironment, loadStudioRig } from "@/components/scene/studio-rig";
import {
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
const FOV_DEGREES = 50;
const CAMERA_DISTANCE = 4;

function computeBounds(aspect: number): Bounds {
  const halfHeight = CAMERA_DISTANCE * Math.tan((FOV_DEGREES * Math.PI) / 360);
  const halfWidth = halfHeight * aspect;
  return { minX: -halfWidth, maxX: halfWidth, minY: -halfHeight, maxY: halfHeight };
}

export function createPoidsLourdEngine(options: PoidsLourdEngineOptions = {}): PoidsLourdEngine {
  const effectId = options.effectId ?? "poids-lourd";
  const getTiltBias = options.getTiltBias ?? (() => ({ x: 0, y: 0 }));

  let renderer: THREE.WebGLRenderer | null = null;
  let container: HTMLElement | null = null;
  let body: THREE.Group | null = null;
  let bounds = computeBounds(1);

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
    held = true;
    velocity = { x: 0, y: 0 };
    const world = screenToWorld(event.clientX, event.clientY);
    history = [{ x: world.x, y: world.y, t: event.timeStamp }];
    reportInteraction(effectId, "grab");
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
    if (!held) return;
    held = false;
    const world = screenToWorld(event.clientX, event.clientY);
    history.push({ x: world.x, y: world.y, t: event.timeStamp });
    velocity = sampleVelocity(history, SAMPLE_HISTORY_MS);
    if (isThrow(velocity, THROW_SPEED)) reportInteraction(effectId, "throw");
  }

  function onResize() {
    if (!container || !renderer) return;
    const rect = container.getBoundingClientRect();
    const aspect = rect.width / rect.height || 1;
    bounds = computeBounds(aspect);
    renderer.setSize(rect.width, rect.height);
  }

  function tick(dt: number) {
    if (held) {
      // Kinematic while grabbed: `onPointerMove` already wrote `position` directly, so
      // there's no gravity/wall integration to run — only the torque below still ticks.
    } else {
      const tilt = getTiltBias();
      const stepped = stepMotion(position, velocity, { x: tilt.x * 4, y: GRAVITY + tilt.y * 4 }, dt);
      const reflected = reflectOffWalls(stepped.position, stepped.velocity, bounds, RADIUS, RESTITUTION);
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
      bounds = computeBounds(aspect);

      const camera = new THREE.PerspectiveCamera(FOV_DEGREES, aspect, 0.1, 100);
      camera.position.set(0, 0, CAMERA_DISTANCE);

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
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));

      const timer = new THREE.Timer();
      const render = () => {
        timer.update();
        const dt = Math.min(timer.getDelta(), 0.05);
        tick(dt);
        renderer?.render(scene, camera);
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
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("resize", onResize);
      cleanupFns.push(() => {
        el.removeEventListener("pointerdown", onPointerDown);
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
      history = [];
      body?.position.set(0, 0, 0);
      body?.rotation.set(0, 0, 0);
    },

    setQualityTier(tier: QualityTier) {
      renderer?.setPixelRatio(tier === "high" ? Math.min(window.devicePixelRatio, 2) : 1);
    },

    dispose() {
      cleanupFns.forEach((fn) => fn());
      cleanupFns.length = 0;
      renderer = null;
      container = null;
      body = null;
    },
  };
}
