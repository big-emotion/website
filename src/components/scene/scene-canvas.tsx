"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CAMERA, computeFit, MATERIAL, STATES, TAU } from "./states";
import { Wordmark } from "@/components/wordmark";

gsap.registerPlugin(ScrollTrigger);

const GLB_URL = "/models/scene.glb";
const DRACO_DECODER_PATH = "/draco/";
const HOLD_DURATION = 0.7; // dwell on each framing before moving (rhythm)
const MOVE_DURATION = 1.0; // transition duration between framings

type Status = "loading" | "ready" | "fallback";

function getSupportsSceneSnapshot(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const probe = document.createElement("canvas");
  return !!(probe.getContext("webgl") || probe.getContext("webgl2"));
}

// Assume support on the server so hydration doesn't flash the fallback markup;
// useSyncExternalStore re-renders with the real client snapshot right after
// mount, which is the sanctioned way to read this kind of browser-only
// capability without a synchronous setState in an effect body.
function getServerSupportsSceneSnapshot(): boolean {
  return true;
}

function subscribeToMotionPreference(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** Chrome studio lighting, procedurally baked into an environment map so the
 *  wordmark reflects light streaks without shipping an HDRI asset. */
function buildStudioEnvironment() {
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

/** Fixed, full-viewport WebGL scene: chrome wordmark that spins in on load, then
 *  zooms/turns through the six STATES keyframes as the user scrolls, with the
 *  background/ink flipping per state (see globals.css `[data-active]` rules).
 *  Falls back to a static wordmark when WebGL is unavailable or the user prefers
 *  reduced motion — content itself always scrolls normally either way. */
export function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const supportsScene = useSyncExternalStore(
    subscribeToMotionPreference,
    getSupportsSceneSnapshot,
    getServerSupportsSceneSnapshot,
  );
  const [status, setStatus] = useState<Status>("loading");
  const [hasScrolled, setHasScrolled] = useState(false);

  // Scroll cue: visible on first screen only, independent of WebGL availability.
  useEffect(() => {
    const onScroll = () => setHasScrolled(true);
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!supportsScene) return;

    const container = containerRef.current;
    if (!container) return;

    const cleanupFns: Array<() => void> = [];
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far,
    );
    camera.position.set(0, 0, CAMERA.distance);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));

    const parallax = new THREE.Group();
    const spin = new THREE.Group();
    parallax.add(spin);
    scene.add(parallax);

    let fit = computeFit(window.innerWidth / window.innerHeight);
    const live = { ...STATES[0] };
    const applyLive = () => {
      spin.scale.setScalar(live.scale * fit);
      spin.position.set(live.x * fit, live.y, 0);
      spin.rotation.set(live.rx, live.ry, live.rz);
    };

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);
    cleanupFns.push(() => window.removeEventListener("pointermove", onPointerMove));

    const clock = new THREE.Clock();
    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      pointer.x += (pointer.tx - pointer.x) * Math.min(dt * 4, 1);
      pointer.y += (pointer.ty - pointer.y) * Math.min(dt * 4, 1);
      parallax.rotation.y = pointer.x * 0.1;
      parallax.rotation.x = pointer.y * 0.06;
      renderer.render(scene, camera);
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      fit = computeFit(window.innerWidth / window.innerHeight);
      applyLive();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    cleanupFns.push(() => window.removeEventListener("resize", onResize));

    const setActive = (i: number) => {
      document.body.dataset.active = String(i);
    };

    function buildScroll() {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanupFns.push(() => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      });

      const mainEl = document.getElementById("main");
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainEl ?? undefined,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
        defaults: { ease: "none" },
        onUpdate: applyLive,
      });
      cleanupFns.push(() => tl.scrollTrigger?.kill());

      let pos = 0;
      setActive(0);
      tl.call(setActive, [0], 0);
      for (let i = 1; i < STATES.length; i++) {
        if (i > 1) {
          tl.to(live, { ...STATES[i - 1], duration: HOLD_DURATION }, pos);
          pos += HOLD_DURATION;
        }
        tl.to(live, { ...STATES[i], duration: MOVE_DURATION, ease: "power1.inOut" }, pos);
        tl.call(setActive, [i], pos + MOVE_DURATION * 0.6);
        pos += MOVE_DURATION;
      }
    }

    function playReveal() {
      Object.assign(live, STATES[0], { ry: STATES[0].ry - TAU, scale: 0.7 });
      applyLive();
      const reveal = gsap.to(live, {
        ...STATES[0],
        duration: 1.3,
        ease: "power2.out",
        onUpdate: applyLive,
        onComplete: buildScroll,
      });
      const skipReveal = () => reveal.progress(1);
      window.addEventListener("scroll", skipReveal, { once: true });
      cleanupFns.push(() => window.removeEventListener("scroll", skipReveal));
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      GLB_URL,
      (gltf) => {
        if (disposed) return;
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
        holder.add(model);
        spin.add(holder);

        setStatus("ready");
        renderer.setAnimationLoop(render);
        playReveal();
      },
      undefined,
      () => {
        if (!disposed) setStatus("fallback");
      },
    );

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      cleanupFns.forEach((fn) => fn());
    };
  }, [supportsScene]);

  const effectiveStatus: Status = supportsScene ? status : "fallback";

  // The scene is a fixed, full-viewport *background underlay*, so it must paint
  // BEHIND the page. A position:fixed layer with z-index:auto paints above its
  // static in-flow siblings, so without a negative z-index the opaque
  // .scene-stage covers every section below the hero and buries their content.
  // -z-10 puts the whole scene behind the flow; each section's own opaque
  // background covers it and only the transparent <Hero> reveals it. The header
  // and scroll-cue sit above via their own higher z-index.
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="scene-stage fixed inset-0" />

      {effectiveStatus === "fallback" ? (
        <div
          data-testid="scene-fallback"
          className="fixed inset-0 flex items-center justify-center"
        >
          <Wordmark className="text-[18vw] leading-none opacity-90" />
        </div>
      ) : (
        <div ref={containerRef} data-testid="scene-canvas" className="fixed inset-0" />
      )}

      {effectiveStatus === "loading" && (
        <div
          data-testid="scene-loader"
          role="status"
          aria-live="polite"
          className="scene-loader fixed inset-0 flex items-center justify-center"
        >
          <span className="sr-only">Loading</span>
          <Wordmark stacked={false} className="scene-loader-mark text-[16vw]" />
        </div>
      )}

      <p className="scene-scrollcue" data-visible={effectiveStatus !== "loading" && !hasScrolled}>
        Scroll
      </p>
    </div>
  );
}
