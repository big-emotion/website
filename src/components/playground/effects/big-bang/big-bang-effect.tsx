"use client";

// The BIG BANG playground effect (SWBE-214, REQ-040): tap the logo, it shatters into
// an attribute-driven Points cloud sampled off the studio-rig wordmark via
// MeshSurfaceSampler (DEC-032), drifts, then reassembles. The registry's `lazy(() =>
// import(...))` (see effects.ts) makes this module's default export the whole
// dependency envelope this effect pulls in — nothing here is imported anywhere else.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { loadStudioRig } from "@/components/scene/studio-rig";
import {
  createWatchdogState,
  recordFrame,
  selectInitialTier,
  TIER_PARTICLE_COUNT,
  type WatchdogState,
} from "./tier";
import { BIG_BANG_FRAGMENT_SHADER, BIG_BANG_VERTEX_SHADER } from "./shaders";

const MAX_PARTICLES = TIER_PARTICLE_COUNT.T2;
const EXPLODE_DISTANCE = 0.9; // world units the far edge of the shatter reaches
const EXPLODE_DURATION_S = 1.1;
const REASSEMBLE_DELAY_S = 0.9; // hold fully-exploded before drifting back
const REASSEMBLE_DURATION_S = 1.5;
const POINT_SIZE = 4;
const CAMERA = { fov: 42, near: 0.1, far: 100, distance: 2.6 } as const;

type Phase = "assembled" | "exploding" | "holding" | "reassembling";

/** Samples the wordmark's meshes into one flat particle buffer at the top tier's
 *  budget; lower tiers render a prefix of it via `geometry.setDrawRange` instead of
 *  reallocating, so a live tier change is just a draw-range write. Positions and
 *  target (exploded) offsets are baked in mesh world space since `holder` is never
 *  added to the scene — the Points object that owns this geometry is, at identity
 *  transform, so "holder world space" and "points local space" coincide. */
function buildParticleGeometry(holder: THREE.Group): THREE.BufferGeometry {
  holder.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  holder.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) meshes.push(mesh);
  });

  const perMesh = Math.max(1, Math.floor(MAX_PARTICLES / Math.max(1, meshes.length)));
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const targets = new Float32Array(MAX_PARTICLES * 3);
  const delays = new Float32Array(MAX_PARTICLES);

  const tempPosition = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();
  let cursor = 0;

  for (const mesh of meshes) {
    if (cursor >= MAX_PARTICLES) break;
    const sampler = new MeshSurfaceSampler(mesh).build();
    const count = Math.min(perMesh, MAX_PARTICLES - cursor);

    for (let i = 0; i < count; i += 1) {
      sampler.sample(tempPosition, tempNormal);
      tempPosition.applyMatrix4(mesh.matrixWorld);
      tempNormal.transformDirection(mesh.matrixWorld);

      const index = cursor + i;
      positions[index * 3] = tempPosition.x;
      positions[index * 3 + 1] = tempPosition.y;
      positions[index * 3 + 2] = tempPosition.z;

      const distance = EXPLODE_DISTANCE * (0.4 + Math.random() * 0.6);
      targets[index * 3] = tempPosition.x + tempNormal.x * distance + (Math.random() - 0.5) * 0.2;
      targets[index * 3 + 1] = tempPosition.y + tempNormal.y * distance + (Math.random() - 0.5) * 0.2;
      targets[index * 3 + 2] = tempPosition.z + tempNormal.z * distance + (Math.random() - 0.5) * 0.2;

      // Baseline stagger before any tap has happened; applyImpactStagger overwrites
      // this once the visitor actually triggers an explosion from a real point.
      delays[index] = Math.random() * 0.6;
    }
    cursor += count;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
  geometry.setDrawRange(0, MAX_PARTICLES);
  return geometry;
}

/** Recomputes aDelay so particles nearest the tap's impact point lead the shockwave
 *  outward, instead of every particle exploding on the same beat. */
function applyImpactStagger(geometry: THREE.BufferGeometry, impact: THREE.Vector3) {
  const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const delayAttr = geometry.getAttribute("aDelay") as THREE.BufferAttribute;
  const point = new THREE.Vector3();

  let maxDistance = 0;
  for (let i = 0; i < positionAttr.count; i += 1) {
    point.fromBufferAttribute(positionAttr, i);
    maxDistance = Math.max(maxDistance, point.distanceTo(impact));
  }

  for (let i = 0; i < positionAttr.count; i += 1) {
    point.fromBufferAttribute(positionAttr, i);
    const normalized = maxDistance > 0 ? point.distanceTo(impact) / maxDistance : 0;
    delayAttr.setX(i, normalized * 0.55 + Math.random() * 0.1);
  }
  delayAttr.needsUpdate = true;
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

function supportsWebgl(): boolean {
  const probe = document.createElement("canvas");
  return !!(probe.getContext("webgl") || probe.getContext("webgl2"));
}

export default function BigBangEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement || !supportsWebgl()) return;
    const container: HTMLDivElement = containerElement;

    let disposed = false;
    const cleanupFns: Array<() => void> = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      container.clientWidth / Math.max(1, container.clientHeight),
      CAMERA.near,
      CAMERA.far,
    );
    camera.position.set(0, 0, CAMERA.distance);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    cleanupFns.push(() => {
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    });

    const material = new THREE.ShaderMaterial({
      vertexShader: BIG_BANG_VERTEX_SHADER,
      fragmentShader: BIG_BANG_FRAGMENT_SHADER,
      uniforms: {
        uProgress: { value: 0 },
        uPointSize: { value: POINT_SIZE },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffb703) }, // --color-tangerine
      },
      transparent: true,
      depthWrite: false,
    });
    cleanupFns.push(() => material.dispose());

    let points: THREE.Points | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    cleanupFns.push(() => geometry?.dispose());

    let watchdog: WatchdogState = createWatchdogState(
      selectInitialTier({
        deviceMemoryGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      }),
      performance.now(),
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.05 };
    const pointer = new THREE.Vector2();

    let phase: Phase = "assembled";
    let phaseStartS = 0;
    let clockS = 0;

    function onPointerDown(event: PointerEvent) {
      if (!points || !geometry || (phase !== "assembled" && phase !== "reassembling")) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObject(points, false);
      if (!hit) return;

      applyImpactStagger(geometry, hit.point);
      phase = "exploding";
      phaseStartS = clockS;
    }
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    cleanupFns.push(() => renderer.domElement.removeEventListener("pointerdown", onPointerDown));

    function onResize() {
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onResize);
    cleanupFns.push(() => window.removeEventListener("resize", onResize));

    loadStudioRig(
      (holder) => {
        if (disposed) return;
        geometry = buildParticleGeometry(holder);
        points = new THREE.Points(geometry, material);
        scene.add(points);
      },
      () => {
        // Load failure: the effect stays an empty stage rather than throwing — there
        // is nothing meaningful to shatter without the logo geometry.
      },
    );

    let lastFrameMs = performance.now();
    renderer.setAnimationLoop(tick);
    cleanupFns.push(() => renderer.setAnimationLoop(null));

    function tick(nowMs: number) {
      const deltaMs = nowMs - lastFrameMs;
      lastFrameMs = nowMs;
      clockS += deltaMs / 1000;

      watchdog = recordFrame(watchdog, nowMs, deltaMs);
      geometry?.setDrawRange(0, TIER_PARTICLE_COUNT[watchdog.tier]);

      const elapsed = clockS - phaseStartS;
      if (phase === "exploding") {
        const progress = Math.min(1, elapsed / EXPLODE_DURATION_S);
        material.uniforms.uProgress.value = easeInOut(progress);
        if (progress >= 1) {
          phase = "holding";
          phaseStartS = clockS;
        }
      } else if (phase === "holding" && elapsed >= REASSEMBLE_DELAY_S) {
        phase = "reassembling";
        phaseStartS = clockS;
      } else if (phase === "reassembling") {
        const progress = Math.min(1, elapsed / REASSEMBLE_DURATION_S);
        material.uniforms.uProgress.value = 1 - easeInOut(progress);
        if (progress >= 1) phase = "assembled";
      }

      material.uniforms.uTime.value = clockS;
      renderer.render(scene, camera);
    }

    return () => {
      disposed = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div ref={containerRef} data-testid="big-bang-stage" className="h-[70vh] w-full md:h-[80vh]" />
  );
}
