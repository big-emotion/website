"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Logo } from "@/components/logo";
import { CAMERA } from "@/components/scene/states";
import { buildStudioEnvironment, loadStudioRig } from "@/components/scene/studio-rig";
import { applyDamping } from "./damping";
import { clampDolly, DOLLY_DEFAULT } from "./zoom-clamp";
import { INITIAL_ALIGNMENT_STATE, updateAlignment, type AlignmentState } from "./alignment-detector";

// Trackball drag: pixels-to-radians and the momentum released on pointer-up
// (DEC-035 — hand-rolled, OrbitControls rejected). `applyDamping` (pure, unit
// tested) does the actual decay; these are the effect's own tuning constants.
const DRAG_SENSITIVITY = 0.006;
const DAMPING_HALF_LIFE = 0.35;
const VELOCITY_EPSILON = 0.0005;
const ZOOM_SENSITIVITY = 0.0025;

// Matches the key light rigged in studio-rig.ts / scene-canvas.tsx, so the alignment
// detector reads the same light the visitor actually sees streak across the chrome.
const KEY_LIGHT_DIRECTION = new THREE.Vector3(3, 4, 5).normalize();
const KEY_LIGHT_POSITION: [number, number, number] = [3, 4, 5];

type Status = "loading" | "ready" | "error";

/**
 * LUMIERE (REQ-041): hand the home hero's chrome to the visitor directly — drag to
 * spin the wordmark with momentum, scroll/pinch to dolly zoom in on it, and hold it
 * steady on the key light to reveal a glint. Reuses the shared studio rig (SWBE-211)
 * so the chrome is pixel-identical to the home hero (DEC-035).
 */
export default function Lumiere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanupFns: Array<() => void> = [];
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      container.clientWidth / container.clientHeight || 1,
      CAMERA.near,
      CAMERA.far,
    );
    camera.position.set(0, 0, DOLLY_DEFAULT);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);
    cleanupFns.push(() => {
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    });

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromScene(buildStudioEnvironment(), 0.02).texture;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(...KEY_LIGHT_POSITION);
    scene.add(key);
    // The home rig's rim (PG-26), which this effect was missing: without it the chrome's
    // far edge goes unlit and the mark flattens into the backdrop as you turn it — the
    // opposite of what an inspection effect is for.
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));

    const spin = new THREE.Group();
    scene.add(spin);

    // The glint: a sprite, not a bloom post-process (out of scope) — a small
    // additive-lit billboard that only becomes visible once alignment locks in.
    const glintMaterial = new THREE.SpriteMaterial({
      color: 0xfff6d8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const glint = new THREE.Sprite(glintMaterial);
    glint.scale.setScalar(0.5);
    glint.position.set(0.3, 0.2, 0.5);
    spin.add(glint);

    const drag = { active: false, lastX: 0, lastY: 0 };
    const velocity = { yaw: 0, pitch: 0 };
    let alignmentState: AlignmentState = INITIAL_ALIGNMENT_STATE;

    const onPointerDown = (e: PointerEvent) => {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      velocity.yaw = dx * DRAG_SENSITIVITY;
      velocity.pitch = dy * DRAG_SENSITIVITY;
      spin.rotation.y += velocity.yaw;
      spin.rotation.x += velocity.pitch;
    };
    const onPointerUp = () => {
      drag.active = false;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    cleanupFns.push(() => {
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    });

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = clampDolly(camera.position.z + e.deltaY * ZOOM_SENSITIVITY);
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    cleanupFns.push(() => renderer.domElement.removeEventListener("wheel", onWheel));

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);
    cleanupFns.push(() => window.removeEventListener("resize", onResize));

    const timer = new THREE.Timer();
    const render = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);

      if (!drag.active) {
        velocity.yaw = applyDamping(velocity.yaw, dt, DAMPING_HALF_LIFE);
        velocity.pitch = applyDamping(velocity.pitch, dt, DAMPING_HALF_LIFE);
        if (Math.abs(velocity.yaw) > VELOCITY_EPSILON) spin.rotation.y += velocity.yaw;
        if (Math.abs(velocity.pitch) > VELOCITY_EPSILON) spin.rotation.x += velocity.pitch;
      }

      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(spin.quaternion);
      const angleDeg = THREE.MathUtils.radToDeg(forward.angleTo(KEY_LIGHT_DIRECTION));
      alignmentState = updateAlignment(alignmentState, angleDeg, dt * 1000);
      glintMaterial.opacity = alignmentState.aligned ? 1 : 0;

      renderer.render(scene, camera);
    };

    loadStudioRig(
      (holder) => {
        if (disposed) return;
        spin.add(holder);
        setStatus("ready");
        renderer.setAnimationLoop(render);
      },
      () => {
        if (!disposed) setStatus("error");
      },
    );

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full md:h-[80vh]">
      {status === "error" ? (
        // The mark is the whole content on this path, so unlike the header and footer
        // lockups it has to carry a name of its own rather than stay decorative.
        <div role="img" aria-label="BIG EMOTION" className="flex h-full items-center justify-center">
          <Logo className="w-[60%] opacity-90" />
        </div>
      ) : (
        <div ref={containerRef} data-testid="lumiere-canvas" className="h-full w-full" />
      )}
    </div>
  );
}
