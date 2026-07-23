// Key-light alignment detector: the glint sprite (a sprite, not bloom — see the
// ticket's out-of-scope note) reveals once the visitor has held the chrome within
// ALIGNMENT_THRESHOLD_DEG of the key light for a sustained ALIGNMENT_HOLD_MS, so a
// quick pass-through spin doesn't flash it.
export const ALIGNMENT_THRESHOLD_DEG = 6;
export const ALIGNMENT_HOLD_MS = 800;

export type AlignmentState = { dwellMs: number; aligned: boolean };

export const INITIAL_ALIGNMENT_STATE: AlignmentState = { dwellMs: 0, aligned: false };

export function updateAlignment(
  state: AlignmentState,
  angleToKeyLightDeg: number,
  dtMs: number,
): AlignmentState {
  if (angleToKeyLightDeg > ALIGNMENT_THRESHOLD_DEG) {
    return INITIAL_ALIGNMENT_STATE;
  }
  const dwellMs = state.dwellMs + dtMs;
  return { dwellMs, aligned: dwellMs >= ALIGNMENT_HOLD_MS };
}
