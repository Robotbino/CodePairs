/** True when the user has asked the OS to minimise non-essential motion. */
export function prefersReducedMotion(): boolean {
  return (
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
}
