/** Format milliseconds as `m:ss.cs` (centiseconds), e.g. 1:07.42. */
export function formatTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${minutes}:${pad(seconds)}.${pad(cs)}`;
}

/** Format a 0–1 ratio as a whole-number percentage string. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
