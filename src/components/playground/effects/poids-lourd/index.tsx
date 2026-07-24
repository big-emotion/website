"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { defaultLocale, isLocale } from "@/i18n/locales";
import { copy } from "./copy";
import { createPoidsLourdEngine, type PoidsLourdEngine } from "./engine";
import type { Vec2 } from "./physics";
import { TiltPermissionCard } from "./tilt-permission-card";

function getSupportsToySnapshot(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const probe = document.createElement("canvas");
  return !!(probe.getContext("webgl") || probe.getContext("webgl2"));
}

// Assume support on the server so hydration doesn't flash the fallback markup — same
// rationale as scene-canvas.tsx's identical snapshot pair.
function getServerSupportsToySnapshot(): boolean {
  return true;
}

function subscribeToMotionPreference(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * POIDS LOURD (REQ-039, DEC-031): the chrome logo as a grab/drag/throw physics toy
 * inside elastic viewport walls, hand-rolled with no engine dependency. Falls back to
 * a text notice when WebGL is unavailable or the visitor prefers reduced motion —
 * same convention as the hero scene.
 */
export default function PoidsLourdEffect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PoidsLourdEngine | null>(null);
  const tiltBiasRef = useRef<Vec2>({ x: 0, y: 0 });
  const orientationCleanupRef = useRef<() => void>(() => {});

  const supportsToy = useSyncExternalStore(
    subscribeToMotionPreference,
    getSupportsToySnapshot,
    getServerSupportsToySnapshot,
  );

  const activeLocale = useLocale();
  const strings = copy[isLocale(activeLocale) ? activeLocale : defaultLocale];

  useEffect(() => {
    if (!supportsToy) return;
    const container = containerRef.current;
    if (!container) return;

    const engine = createPoidsLourdEngine({
      effectId: "poids-lourd",
      getTiltBias: () => tiltBiasRef.current,
    });
    engineRef.current = engine;
    engine.mount(container);
    engine.setQualityTier(window.matchMedia("(min-width: 768px)").matches ? "high" : "low");

    return () => {
      engine.dispose();
      engineRef.current = null;
      orientationCleanupRef.current();
    };
  }, [supportsToy]);

  function handleTiltGranted() {
    function onOrientation(event: DeviceOrientationEvent) {
      const beta = event.beta ?? 0; // front-back tilt in degrees
      const gamma = event.gamma ?? 0; // left-right tilt in degrees
      tiltBiasRef.current = {
        x: Math.max(-1, Math.min(1, gamma / 45)),
        y: Math.max(-1, Math.min(1, beta / 45)),
      };
    }
    window.addEventListener("deviceorientation", onOrientation);
    orientationCleanupRef.current = () => window.removeEventListener("deviceorientation", onOrientation);
  }

  if (!supportsToy) {
    return (
      <p role="status" aria-live="polite" className="px-5 py-20 md:px-8">
        {strings.fallback}
      </p>
    );
  }

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full">
      <div
        ref={containerRef}
        data-testid="poids-lourd-stage"
        role="img"
        aria-label={strings.ariaLabel}
        className="h-full w-full touch-none"
      />
      {/* Pointer-device gestures, so they are addressed to pointer-device viewports only
          — and pinned to the top of the stage, where the logo never rests: gravity keeps
          it at the bottom, which is also where the reset control lives. */}
      <p className="absolute top-4 left-5 hidden text-xs uppercase tracking-wide text-ink/70 md:left-8 md:block">
        {strings.gestures}
      </p>
      <button
        type="button"
        onClick={() => engineRef.current?.reset()}
        className="font-display absolute right-5 bottom-5 min-h-11 bg-ink px-4 text-sm uppercase tracking-wide text-lemon transition-opacity hover:opacity-80"
      >
        {strings.reset}
      </button>
      <TiltPermissionCard copy={strings.tilt} onGranted={handleTiltGranted} onUnavailable={() => {}} />
    </div>
  );
}
