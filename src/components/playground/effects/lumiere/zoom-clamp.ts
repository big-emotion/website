import { CAMERA } from "@/components/scene/states";

// The wordmark's size once `loadStudioRig` has centred it and divided it down so its
// largest axis measures 1 unit: 1.022 wide x 0.552 high x 0.392 deep, read off the
// shipped GLB. WORDMARK_RADIUS is half that box's diagonal — the farthest any vertex
// sits from the pivot — so it bounds the mesh at every angle the trackball reaches,
// not just face-on. Re-measure both if scene.glb is ever re-exported.
export const WORDMARK_HEIGHT = 0.552;
export const WORDMARK_RADIUS = 0.613;

// Dolly-zoom bounds for LUMIERE's inspection camera: same starting framing as the
// home hero (REQ-041's "home-identical chrome"), clamped so a visitor can zoom in to
// read the glint detail but never dolly through the mesh or lose it in the distance.
// DOLLY_MIN brings the wordmark to ~80% of the frame height; the hard floor is
// WORDMARK_RADIUS + CAMERA.near (~0.71), below which a corner swung towards the
// camera by a drag would clip through the near plane mid-spin.
export const DOLLY_DEFAULT = CAMERA.distance;
export const DOLLY_MIN = 0.9;
export const DOLLY_MAX = 4.5;

export function clampDolly(distance: number): number {
  return Math.min(DOLLY_MAX, Math.max(DOLLY_MIN, distance));
}
