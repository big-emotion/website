"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CAMERA, computeFit, STATES, TAU } from "./states";
import { buildStudioEnvironment, loadStudioRig } from "./studio-rig";
import { Logo } from "@/components/logo";
import { content } from "@/content/site";
import { defaultLocale, isLocale } from "@/i18n/locales";

gsap.registerPlugin(ScrollTrigger);

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

/** Fixed, full-viewport WebGL scene: chrome wordmark that spins in on load, then
 *  zooms/turns through the six STATES keyframes as the user scrolls, with the
 *  background/ink flipping per state (see globals.css `[data-active]` rules).
 *  Falls back to a static wordmark when WebGL is unavailable or the user prefers
 *  reduced motion — content itself always scrolls normally either way. */
export function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const finalMarkRef = useRef<HTMLDivElement>(null);
  const supportsScene = useSyncExternalStore(
    subscribeToMotionPreference,
    getSupportsSceneSnapshot,
    getServerSupportsSceneSnapshot,
  );
  const [status, setStatus] = useState<Status>("loading");
  const [hasScrolled, setHasScrolled] = useState(false);
  // The cue is display type, so its label is marketing copy and lives in site.ts, not in
  // messages/*.json. `isLocale` is the narrowing — routing already rejects the rest.
  const activeLocale = useLocale();
  const { scrollCue } = content[isLocale(activeLocale) ? activeLocale : defaultLocale];

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

    const timer = new THREE.Timer();
    const render = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
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

      // The giant wordmark surfaces behind the mark on the final move only: linear
      // under scrub over the last 0.6 timeline units, concurrent with the last
      // MOVE's tail — the reference site's exact tween.
      if (finalMarkRef.current) {
        tl.to(finalMarkRef.current, { opacity: 1, duration: 0.6 }, pos - 0.6);
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

    loadStudioRig(
      (holder) => {
        if (disposed) return;
        spin.add(holder);

        setStatus("ready");
        renderer.setAnimationLoop(render);
        playReveal();
      },
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
  // -z-10 puts the whole scene behind the flow, where the transparent scroll
  // panels let it show through for the length of the page. The header and
  // scroll-cue sit above via their own higher z-index.
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="scene-stage fixed inset-0" />
      {/* Between stage and canvas so the 3D mark renders on top of it — DOM order is
          the paint order inside this underlay. GSAP fades it in on the final beat. */}
      <div ref={finalMarkRef} data-testid="scene-finalmark" className="scene-finalmark fixed inset-0" />

      {effectiveStatus === "fallback" ? (
        <div
          data-testid="scene-fallback"
          className="fixed inset-0 flex items-center justify-center"
        >
          <Logo className="w-[70vw] opacity-90" />
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
          {/* Left untranslated on purpose: this whole subtree sits under aria-hidden, so
              no assistive tech ever reads it. Translate it the day the loader is exposed
              — that is also when it earns a messages/*.json key. */}
          <span className="sr-only">Loading</span>
          <Logo className="scene-loader-mark w-[46vw]" />
        </div>
      )}

      <p className="scene-scrollcue" data-visible={effectiveStatus !== "loading" && !hasScrolled}>
        {scrollCue}
      </p>
    </div>
  );
}
