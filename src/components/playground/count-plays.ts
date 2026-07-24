// The missing link in the collective counter (SWBE-216/REQ-042).
//
// Both ends of the chain shipped and neither was joined to the other: the effects call
// `reportInteraction`, which dispatches `playground:interaction` on `window`, and
// `playgroundCounter` knows how to batch increments and POST them. Nothing subscribed,
// so the chip was structurally stuck at zero no matter how hard a visitor played.
//
// One notable gesture is one play: POIDS LOURD counts a grab, a throw and each wall
// bounce, LUMIERE counts a full turn of the mark. The batcher coalesces them into one
// request every few seconds, so the number moves a beat after the gesture rather than
// on it.

import {
  PLAYGROUND_INTERACTION_EVENT,
  type PlaygroundInteractionDetail,
} from "./report-interaction";
import type { CounterBatcher } from "./counter-client";

/**
 * Starts counting the interactions effects report. Returns the unsubscribe, which the
 * caller runs on unmount — an effect page that has been left must stop feeding the
 * counter, or a stale listener would keep crediting plays to a page nobody is on.
 */
export function countPlays(counter: CounterBatcher): () => void {
  function onInteraction(event: Event) {
    const detail = (event as CustomEvent<PlaygroundInteractionDetail>).detail;
    if (!detail?.effectId) return;
    counter.recordPlay(detail.effectId);
  }

  window.addEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
  return () => window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
}
