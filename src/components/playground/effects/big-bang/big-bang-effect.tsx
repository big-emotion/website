"use client";

// The BIG BANG playground effect (SWBE-214, REQ-040): the home hero's chrome wordmark,
// floating on a slow idle spin. Click it and the patch you hit blows outward and springs
// back, throwing brand-coloured sparks from the exact point of impact — every click, and
// several at once (see impact.ts). The registry's `lazy(() => import(...))` (effects.ts)
// makes this module's default export the whole dependency envelope the effect pulls in.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CAMERA } from "@/components/scene/states";
import { buildStudioEnvironment, loadStudioRig } from "@/components/scene/studio-rig";
import { reportInteraction } from "@/components/playground/report-interaction";
import {
  burstEnvelope,
  burstParticleCount,
  IMPACT_AMPLITUDE,
  IMPACT_DURATION_S,
  IMPACT_RADIUS,
  MAX_CONCURRENT_IMPACTS,
  nextImpactSlot,
} from "./impact";
import {
  createWatchdogState,
  recordFrame,
  selectInitialTier,
  type WatchdogState,
} from "./tier";
import {
  CHROME_IMPACT_CHUNKS,
  DEBRIS_FRAGMENT_SHADER,
  DEBRIS_VERTEX_SHADER,
} from "./shaders";

const EFFECT_ID = "big-bang";
// Idle motion is a slow sway, not a full turn: a continuous spin shows the back of the
// wordmark half the time, and the mark has to stay readable while you aim at it.
const IDLE_SWAY_RADIANS = 0.45;
const IDLE_SWAY_RAD_PER_S = 0.35;
// The burst has to stay legible as damage to the spot you hit. Sparks reaching much
// past the impact radius, or drawn much larger than this, curtain the wordmark instead
// of scarring it — which is the failure the whole rewrite is undoing.
/** How far the furthest spark travels, in the same unit space as IMPACT_RADIUS. */
const DEBRIS_SPREAD = 0.3;
/** On-screen spark size at one world unit from the camera, in pixels. */
const DEBRIS_POINT_SIZE = 9;

// Brand tokens, as the sparks' palette (globals.css). Kept as literals because a shader
// attribute needs numbers, not CSS custom properties.
const SPARK_COLORS = [0xf2ff26, 0xff5200, 0xffffff] as const;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function supportsWebgl(): boolean {
  const probe = document.createElement("canvas");
  return !!(probe.getContext("webgl") || probe.getContext("webgl2"));
}

/** One burst: a Points cloud whose particles all leave from wherever it is parked. */
function createDebrisBurst(particleCount: number) {
  const positions = new Float32Array(particleCount * 3); // all at the burst's own origin
  const directions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  const color = new THREE.Color();

  for (let i = 0; i < particleCount; i += 1) {
    // Uniform on the sphere: sampling angles independently would bunch the sparks at
    // the poles and leave a visible seam around the equator.
    const theta = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const radial = Math.sqrt(1 - z * z);
    directions[i * 3] = radial * Math.cos(theta);
    directions[i * 3 + 1] = radial * Math.sin(theta);
    directions[i * 3 + 2] = z;

    speeds[i] = 0.35 + Math.random() * 0.65;

    color.setHex(SPARK_COLORS[i % SPARK_COLORS.length]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aDirection", new THREE.BufferAttribute(directions, 3));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  // The cloud starts as a point, so three.js cannot infer a useful bounding sphere from
  // the positions alone — without this it culls the whole burst on the first frame.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), DEBRIS_SPREAD);

  const material = new THREE.ShaderMaterial({
    vertexShader: DEBRIS_VERTEX_SHADER,
    fragmentShader: DEBRIS_FRAGMENT_SHADER,
    uniforms: {
      uProgress: { value: 1 },
      uSpread: { value: DEBRIS_SPREAD },
      uPointSize: { value: DEBRIS_POINT_SIZE },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;
  points.frustumCulled = false;
  return { points, geometry, material };
}

export default function BigBangEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement || !supportsWebgl()) return;
    const container: HTMLDivElement = containerElement;

    let disposed = false;
    const cleanupFns: Array<() => void> = [];
    const reducedMotion = window.matchMedia(MOTION_QUERY).matches;

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);
    cleanupFns.push(() => {
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    });

    // The studio rig, verbatim from the home hero (PG-26) — environment, key, rim and
    // hemisphere. This is what the effect was missing: without the mesh and its lighting
    // there was no chrome logo on the page at all.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromScene(buildStudioEnvironment(), 0.02).texture;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));

    const spin = new THREE.Group();
    scene.add(spin);

    let watchdog: WatchdogState = createWatchdogState(
      selectInitialTier({
        deviceMemoryGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      }),
      performance.now(),
    );

    const bursts = Array.from({ length: MAX_CONCURRENT_IMPACTS }, () =>
      createDebrisBurst(burstParticleCount(watchdog.tier)),
    );
    bursts.forEach((burst) => {
      spin.add(burst.points);
      cleanupFns.push(() => {
        burst.geometry.dispose();
        burst.material.dispose();
      });
    });

    // Every deformable mesh keeps its own copy of the pool, expressed in its own local
    // space: converting once per click beats converting every vertex every frame.
    type ImpactTarget = { mesh: THREE.Mesh; impacts: THREE.Vector4[] };
    const targets: ImpactTarget[] = [];
    // Backdated so every slot reads as spent before the first click.
    const impactStartS = Array.from({ length: MAX_CONCURRENT_IMPACTS }, () => -IMPACT_DURATION_S);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let clockS = 0;

    function onPointerDown(event: PointerEvent) {
      if (targets.length === 0) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(
        targets.map((target) => target.mesh),
        false,
      );
      // Clicking the empty stage does nothing: the explosion belongs to the logo, and
      // firing one in mid-air would break the illusion that you struck something.
      if (!hit) return;

      const slot = nextImpactSlot(impactStartS, clockS);
      impactStartS[slot] = clockS;

      for (const target of targets) {
        const local = target.mesh.worldToLocal(hit.point.clone());
        target.impacts[slot].set(local.x, local.y, local.z, 0);
      }

      const burst = bursts[slot];
      burst.points.position.copy(spin.worldToLocal(hit.point.clone()));
      burst.points.visible = true;

      reportInteraction(EFFECT_ID, "explode");
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
        holder.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;

          // Cloned so each mesh owns its uniform block: the GLB shares one material
          // across meshes, and a shared block would put every hit point in the wrong
          // local space for all but one of them.
          const material = (mesh.material as THREE.MeshStandardMaterial).clone();
          const impacts = Array.from(
            { length: MAX_CONCURRENT_IMPACTS },
            () => new THREE.Vector4(0, 0, 0, 0),
          );

          material.onBeforeCompile = (shader) => {
            shader.uniforms.uImpacts = { value: impacts };
            shader.uniforms.uImpactRadius = { value: IMPACT_RADIUS };
            shader.uniforms.uImpactAmplitude = { value: IMPACT_AMPLITUDE };
            shader.vertexShader = shader.vertexShader
              .replace("#include <common>", `#include <common>\n${CHROME_IMPACT_CHUNKS.declaration}`)
              .replace("#include <begin_vertex>", CHROME_IMPACT_CHUNKS.displacement);
          };
          mesh.material = material;
          cleanupFns.push(() => material.dispose());
          targets.push({ mesh, impacts });
        });

        spin.add(holder);
      },
      () => {
        // Load failure: the stage stays empty rather than throwing — there is nothing
        // meaningful to break without the logo geometry.
      },
    );

    let lastFrameMs = performance.now();
    renderer.setAnimationLoop(tick);
    cleanupFns.push(() => renderer.setAnimationLoop(null));

    function tick(nowMs: number) {
      const deltaMs = nowMs - lastFrameMs;
      lastFrameMs = nowMs;
      const deltaS = deltaMs / 1000;
      clockS += deltaS;

      watchdog = recordFrame(watchdog, nowMs, deltaMs);
      if (!reducedMotion) {
        spin.rotation.y = Math.sin(clockS * IDLE_SWAY_RAD_PER_S) * IDLE_SWAY_RADIANS;
      }

      for (let slot = 0; slot < MAX_CONCURRENT_IMPACTS; slot += 1) {
        const elapsed = clockS - impactStartS[slot];
        const strength = burstEnvelope(elapsed);
        for (const target of targets) target.impacts[slot].w = strength;

        const burst = bursts[slot];
        if (elapsed >= IMPACT_DURATION_S) {
          burst.points.visible = false;
        } else {
          burst.material.uniforms.uProgress.value = elapsed / IMPACT_DURATION_S;
        }
      }

      renderer.render(scene, camera);
    }

    return () => {
      disposed = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="big-bang-stage"
      className="h-[70vh] min-h-[420px] w-full touch-none md:h-[80vh]"
    />
  );
}
