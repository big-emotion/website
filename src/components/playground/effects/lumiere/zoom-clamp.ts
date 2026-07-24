import {
  resolveFraming,
  stepFraming,
  type CameraFraming,
} from "@/components/playground/camera-framing";
import type { ZoomDirection } from "@/components/playground/zoom-controls";
import { CAMERA } from "@/components/scene/states";

// The wordmark's size once `loadStudioRig` has centred it and divided it down so its
// largest axis measures 1 unit: 1.022 wide x 0.552 high x 0.392 deep, read off the
// shipped GLB. WORDMARK_RADIUS is half that box's diagonal — the farthest any vertex
// sits from the pivot — so it bounds the mesh at every angle the trackball reaches,
// not just face-on. Re-measure both if scene.glb is ever re-exported.
export const WORDMARK_HEIGHT = 0.552;
export const WORDMARK_RADIUS = 0.613;

// Framing bounds for LUMIERE's inspection camera: it opens on the home hero's own
// framing (REQ-041's "home-identical chrome"), pulls back to hold the whole mark, and
// closes in far enough that the glint is inspected rather than glanced at.
export const DOLLY_DEFAULT = CAMERA.distance;
export const DOLLY_MIN = 0.3;
export const DOLLY_MAX = 4.5;

// Where the camera body stops travelling and the lens takes over (see `resolveFraming`).
// This is the framing that puts the wordmark at ~80% of the frame height, and it clears
// the hard floor of WORDMARK_RADIUS + CAMERA.near (~0.71) below which a corner swung
// towards the camera by a drag would slice through the near plane mid-spin. Every
// framing tighter than this one is carried by the lens, which is what lets the closest
// framing magnify three times further without the camera moving an inch.
export const DOLLY_BODY_FLOOR = 0.9;

export function clampDolly(framing: number): number {
  return Math.min(DOLLY_MAX, Math.max(DOLLY_MIN, framing));
}

export function stepDolly(framing: number, direction: ZoomDirection): number {
  return clampDolly(stepFraming(framing, direction));
}

/** Where to put the camera, and how wide to open it, for a given framing. */
export function dollyFraming(framing: number): CameraFraming {
  return resolveFraming(clampDolly(framing), DOLLY_BODY_FLOOR);
}
