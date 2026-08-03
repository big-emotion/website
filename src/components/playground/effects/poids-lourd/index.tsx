"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { defaultLocale, isLocale } from "@/i18n/locales";
import {
  DEFAULT_STAGE_THEME,
  STAGE_COLOR_HEX,
  stageColorToken,
} from "@/components/playground/stage-theme";
import { StageThemeControls } from "@/components/playground/stage-theme-controls";
import { ZoomControls, type ZoomDirection } from "@/components/playground/zoom-controls";
import { copy } from "./copy";
import { createPoidsLourdEngine, type PoidsLourdEngine } from "./engine";
import { TIME_SCALE_MAX, TIME_SCALE_MIN, type GravityDirection, type Vec2 } from "./physics";
import { TiltPermissionCard } from "./tilt-permission-card";

// Reading order of the pad mirrors a keyboard's inverted-T; the glyphs are decorative,
// the aria-labels carry the meaning.
const GRAVITY_PAD = [
  { direction: "up", glyph: "↑" },
  { direction: "left", glyph: "←" },
  { direction: "down", glyph: "↓" },
  { direction: "right", glyph: "→" },
] as const satisfies ReadonlyArray<{ direction: GravityDirection; glyph: string }>;

// Positive-only memo: `getSnapshot` runs on every render, and the control overlay
// re-renders per slider step — probing WebGL each time mints a real context and walks
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
  const locale = isLocale(activeLocale) ? activeLocale : defaultLocale;
  const strings = copy[locale];

  const [timeScale, setTimeScale] = useState(1);
  const [gravity, setGravity] = useState<GravityDirection>("down");
  const [theme, setTheme] = useState(DEFAULT_STAGE_THEME);

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

  // Declared after the mount effect so a remount (reduced-motion flip) re-applies the
  // visitor's settings to the fresh engine — `supportsToy` is a dep for that reason.
  useEffect(() => {
    engineRef.current?.setTimeScale(timeScale);
    engineRef.current?.setGravityDirection(gravity);
    engineRef.current?.setLogoColor(STAGE_COLOR_HEX[theme.logo]);
  }, [timeScale, gravity, theme, supportsToy]);

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
    orientationCleanupRef.current = () =>
      window.removeEventListener("deviceorientation", onOrientation);
  }

  if (!supportsToy) {
    return (
      <p role="status" aria-live="polite" className="px-5 py-20 md:px-8">
        {strings.fallback}
      </p>
    );
  }

  return (
    // The theme's backdrop paints the stage frame, not the page: the canvas renders
    // with alpha, so the colour shows through it — and survives any zoom framing.
    <div
      className="relative h-[70vh] min-h-[420px] w-full"
      style={{ backgroundColor: stageColorToken(theme.backdrop) }}
    >
      <div
        ref={containerRef}
        data-testid="poids-lourd-stage"
        role="img"
        aria-label={strings.ariaLabel}
        className="h-full w-full touch-none"
      />
      {/* Pointer-device gestures, so they are addressed to pointer-device viewports only
          — and pinned to the top of the stage, away from the bottom corners the zoom and
          reset controls own. */}
      {/* Chipped on bg-paper so it survives every stage-theme backdrop, ink included. */}
      <p className="absolute top-4 left-5 hidden bg-paper/80 px-2 py-1 text-xs uppercase tracking-wide text-ink/80 md:left-8 md:block">
        {strings.gestures}
      </p>
      {/* Physics settings claim the last free corner. The pad and slider talk to the
          engine through the sync effect above, so a remount inherits them. */}
      <div className="absolute top-4 right-5 flex flex-col items-end gap-2 md:right-8">
        <div role="group" aria-label={strings.gravity.label} className="flex gap-1">
          {GRAVITY_PAD.map(({ direction, glyph }) => (
            <button
              key={direction}
              type="button"
              aria-label={strings.gravity[direction]}
              aria-pressed={gravity === direction}
              onClick={() => setGravity(direction)}
              className="flex size-11 items-center justify-center bg-ink text-lemon transition-opacity hover:opacity-80 aria-pressed:bg-lemon aria-pressed:text-ink"
            >
              <span aria-hidden="true">{glyph}</span>
            </button>
          ))}
        </div>
        <div className="flex min-h-11 items-center gap-2">
          <span
            aria-hidden="true"
            className="hidden bg-paper/80 px-2 py-1 text-xs uppercase tracking-wide text-ink/80 md:inline"
          >
            {strings.speed.label}
          </span>
          {/* min-h-11 on the input itself: a range's hit area is its border box, and
              on mobile this slider is the whole control (the label is md-only). */}
          <input
            type="range"
            min={TIME_SCALE_MIN}
            max={TIME_SCALE_MAX}
            step={0.25}
            value={timeScale}
            onChange={(event) => setTimeScale(Number(event.target.value))}
            aria-label={strings.speed.label}
            className="min-h-11 w-28 accent-ink"
          />
        </div>
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
      <TiltPermissionCard
        copy={strings.tilt}
        onGranted={handleTiltGranted}
        onUnavailable={() => {}}
      />
    </div>
  );
}
