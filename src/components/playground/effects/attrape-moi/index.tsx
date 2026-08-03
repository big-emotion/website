"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { defaultLocale, isLocale } from "@/i18n/locales";
import {
  DEFAULT_STAGE_THEME,
  STAGE_COLOR_HEX,
  stageBallColor,
  stageColorToken,
} from "@/components/playground/stage-theme";
import { StageThemeControls } from "@/components/playground/stage-theme-controls";
import { ZoomControls, type ZoomDirection } from "@/components/playground/zoom-controls";
import { copy } from "./copy";
import { createAttrapeMoiEngine, type AttrapeMoiEngine } from "./engine";

// Positive-only memo: `getSnapshot` runs on every render, and the control overlay
// re-renders per theme pick — probing WebGL each time mints a real context and walks
// into Chrome's 16-live-context cap, evicting the toy's own renderer. A browser never
// gains WebGL mid-session, so one successful probe is final; failures allocate
// nothing and stay unmemoized.
let webglProbeSucceeded = false;
function probeWebgl(): boolean {
  if (webglProbeSucceeded) return true;
  const probe = document.createElement("canvas");
  const context = probe.getContext("webgl") || probe.getContext("webgl2");
  if (context) {
    context.getExtension?.("WEBGL_lose_context")?.loseContext();
    webglProbeSucceeded = true;
  }
  return webglProbeSucceeded;
}

function getSupportsToySnapshot(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return probeWebgl();
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
 * ATTRAPE-MOI: the B2B espace's home toy brought into the Playground — the staged
 * wordmark with a small elastic ball bouncing around it; the ball lights the chrome
 * as it travels, brushing the logo wobbles it, and catching the ball is the hidden
 * challenge. Ported from b2b-space's BrandMotionStage (same owner), rebuilt on the
 * studio rig and the PG-21 engine lifecycle.
 */
export default function AttrapeMoiEffect() {
  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<AttrapeMoiEngine | null>(null);

  const supportsToy = useSyncExternalStore(
    subscribeToMotionPreference,
    getSupportsToySnapshot,
    getServerSupportsToySnapshot,
  );

  const activeLocale = useLocale();
  const locale = isLocale(activeLocale) ? activeLocale : defaultLocale;
  const strings = copy[locale];

  const [theme, setTheme] = useState(DEFAULT_STAGE_THEME);

  useEffect(() => {
    if (!supportsToy) return;
    const stage = stageRef.current;
    const ball = ballRef.current;
    if (!stage || !ball) return;

    const engine = createAttrapeMoiEngine({ effectId: "attrape-moi" });
    engineRef.current = engine;
    engine.mount(stage, ball);
    engine.setQualityTier(window.matchMedia("(min-width: 768px)").matches ? "high" : "low");

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [supportsToy]);

  // Declared after the mount effect so a remount (reduced-motion flip) re-applies the
  // visitor's tint to the fresh engine — `supportsToy` is a dep for that reason.
  useEffect(() => {
    engineRef.current?.setLogoColor(STAGE_COLOR_HEX[theme.logo]);
  }, [theme, supportsToy]);

  if (!supportsToy) {
    return (
      <p role="status" aria-live="polite" className="px-5 py-20 md:px-8">
        {strings.fallback}
      </p>
    );
  }

  return (
    // The theme's backdrop paints the stage frame, not the page: the canvas renders
    // with alpha, so the colour shows through it — and survives any framing.
    <div
      className="relative h-[70vh] min-h-[420px] w-full"
      style={{ backgroundColor: stageColorToken(theme.backdrop) }}
    >
      <div
        ref={stageRef}
        data-testid="attrape-moi-stage"
        role="group"
        tabIndex={0}
        aria-label={strings.ariaLabel}
        aria-describedby="attrape-moi-instructions"
        className="h-full w-full touch-none"
      />
      <p id="attrape-moi-instructions" className="sr-only">
        {strings.instructions}
      </p>
      {/* The engine owns this button's transform; everything else about it is CSS.
          It sits over the stage, so catching it never reads as a logo drag. The ball
          is a flat mark: its colour follows the theme so it never blends away. */}
      <button
        ref={ballRef}
        type="button"
        aria-label={strings.ball}
        style={{ backgroundColor: stageColorToken(stageBallColor(theme)) }}
        className="absolute top-0 left-0 z-10 size-11 cursor-grab touch-none rounded-full active:cursor-grabbing"
      />
      <div className="absolute top-4 right-5 md:right-8">
        <StageThemeControls locale={locale} theme={theme} onThemeChange={setTheme} />
      </div>
      <ZoomControls
        locale={locale}
        onZoom={(direction: ZoomDirection) => engineRef.current?.zoom(direction)}
      />
      <button
        type="button"
        onClick={() => engineRef.current?.reset()}
        className="font-display absolute right-5 bottom-5 min-h-11 bg-ink px-4 text-sm uppercase tracking-wide text-lemon transition-opacity hover:opacity-80"
      >
        {strings.reset}
      </button>
    </div>
  );
}
