// How far "in" a Playground effect can be zoomed, shared by every effect that hands the
// wordmark to the visitor. Pure and renderer-free, so the framing maths is unit-tested
// without a canvas — same split as physics.ts is to poids-lourd's engine.

import { CAMERA } from "@/components/scene/states";
import type { ZoomDirection } from "./zoom-controls";

/** Where the camera body sits, and how tight its lens is, for one framing scalar. */
export type CameraFraming = { distance: number; fov: number };

/**
 * How much one press of a zoom control multiplies the framing by. Multiplying rather
 * than adding is what keeps a press feeling the same size everywhere on the range: a
 * fixed step sized for the far half nudges imperceptibly out there and then swallows
 * the near half in two presses.
 */
export const ZOOM_RATIO = 1.4;

export function stepFraming(framing: number, direction: ZoomDirection): number {
  return direction === "in" ? framing / ZOOM_RATIO : framing * ZOOM_RATIO;
}

/** Continuous counterpart of `stepFraming`, for the wheel and pinch deltas. Same
 *  multiplicative axis, so a notch is worth as much up close as far out. */
export function scrubFraming(framing: number, deltaY: number, sensitivity: number): number {
  return framing * Math.exp(deltaY * sensitivity);
}

/**
 * Splits a framing scalar into a camera position and a field of view.
 *
 * Down to `bodyFloor` this is a plain dolly — the camera simply travels. Below it the
 * body stops and the lens takes over, narrowing by exactly what the camera stopped
 * short of. That is the only way past the floor: a dolly that kept going would push
 * the near plane through the mesh (and, in an effect with walls, close them inside the
 * body), while a longer lens magnifies the same geometry from a safe distance.
 *
 * `distance * tan(fov / 2)` is preserved by construction, so a visitor cannot tell
 * which half moved — and everything else derived from the framing (visible bounds,
 * screen-to-world) keeps computing off the framing scalar and the rig's default FOV,
 * needing no knowledge of the split.
 */
export function resolveFraming(framing: number, bodyFloor: number): CameraFraming {
  const distance = Math.max(framing, bodyFloor);
  const halfHeight = framing * Math.tan((CAMERA.fov * Math.PI) / 360);
  return { distance, fov: (2 * Math.atan(halfHeight / distance) * 180) / Math.PI };
}
