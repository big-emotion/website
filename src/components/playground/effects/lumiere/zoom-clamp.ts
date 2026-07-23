import { CAMERA } from "@/components/scene/states";

// Dolly-zoom bounds for LUMIERE's inspection camera: same starting framing as the
// home hero (REQ-041's "home-identical chrome"), clamped so a visitor can zoom in to
// read the glint detail but never dolly through the mesh or lose it in the distance.
export const DOLLY_DEFAULT = CAMERA.distance;
export const DOLLY_MIN = 1.4;
export const DOLLY_MAX = 4.5;

export function clampDolly(distance: number): number {
  return Math.min(DOLLY_MAX, Math.max(DOLLY_MIN, distance));
}
