// Six-keyframe choreography for the scroll-driven hero scene (SWBE-20), captured
// from the approved motion-preview prototype per the SWBE-18 Appendix. Consumed by
// the scrub logic in scene-canvas.tsx — never hardcode these values inline there.

export const TAU = Math.PI * 2;

/** Brand tokens from src/app/globals.css — never a raw hex value here. */
export type BrandToken = "lemon" | "tangerine" | "lyon" | "ink" | "paper";

export type SceneState = {
  name: "intro" | "approach" | "cases" | "culture" | "louder" | "final";
  /** Uniform scale of the wordmark. */
  scale: number;
  /** Position offset in world units (side-slide, opposite the copy). */
  x: number;
  y: number;
  /** Rotation in radians. */
  rx: number;
  ry: number;
  rz: number;
  /** Fixed backdrop token for this state. */
  stage: BrandToken;
  /** Foreground/ink token kept readable against `stage`. */
  ink: BrandToken;
};

// Scale grows monotonically until the final state, which performs one more full
// turn (TAU) and docks face-on, closer to camera, above the closing manifesto text.
// Each section turns AND slides in the direction it turns, freeing space for the copy.
export const STATES: readonly SceneState[] = [
  { name: "intro", scale: 1.4, x: 0, y: 0, rx: 0, ry: 0, rz: 0, stage: "lemon", ink: "ink" },
  {
    name: "approach",
    scale: 2.3,
    x: 0.7,
    y: -0.02,
    rx: 0.07,
    ry: 0.5,
    rz: 0,
    stage: "lemon",
    ink: "ink",
  },
  {
    name: "cases",
    scale: 2.8,
    x: -0.9,
    y: 0.02,
    rx: 0.07,
    ry: -0.6,
    rz: 0,
    stage: "tangerine",
    ink: "ink",
  },
  {
    name: "culture",
    scale: 3.3,
    x: 1.1,
    y: -0.02,
    rx: 0.06,
    ry: 0.6,
    rz: 0,
    stage: "lyon",
    ink: "ink",
  },
  {
    name: "louder",
    scale: 3.8,
    x: -1.3,
    y: 0.02,
    rx: 0.07,
    ry: -0.7,
    rz: 0,
    stage: "ink",
    ink: "lemon",
  },
  { name: "final", scale: 0.5, x: 0, y: 0.34, rx: 0, ry: -TAU, rz: 0, stage: "paper", ink: "ink" },
] as const;

export const CAMERA = { fov: 42, near: 0.1, far: 100, distance: 2.6 } as const;

export const MATERIAL = { metalness: 1, roughness: 0.22, envMapIntensity: 1.15 } as const;

/** Portrait/mobile only: desktop landscape always renders at fit = 1. */
export function computeFit(aspect: number): number {
  return aspect >= 1 ? 1 : Math.max(0.45, aspect * 0.9);
}
