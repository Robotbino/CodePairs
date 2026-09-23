/**
 * Game timing, in milliseconds. FLIP_MS must match `--cp-t-flip` in
 * src/styles/_tokens.scss so the service and the CSS flip stay in step.
 */

/** Duration of a card's 3D flip. */
export const FLIP_MS = 320;

/**
 * How long a mismatched pair stays face-up (measured from the second tap)
 * before it flips back. The board ignores taps for this long.
 */
export const MISMATCH_HIDE_MS = 650;

/** Pause after the final pair resolves before the results overlay appears. */
export const RESULTS_DELAY_MS = 450;

/**
 * Taps this soon after a screen change (entering the level picker, dealing a
 * new board) are ignored: they are the second half of a double-tap on the
 * button that caused the change, not a new decision.
 */
export const TAP_GUARD_MS = 300;
