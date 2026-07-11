/** Run metric formatting. Time is stored as whole seconds. */

/** 2670 -> '44:30', 3730 -> '1:02:10' */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/**
 * '44:30' -> 2670, '1:02:10' -> 3730, '45' -> 2700 (bare number = minutes).
 * Returns null for empty/unparseable input.
 */
export function parseDuration(input: string): number | null {
  const parts = input.trim().split(':');
  if (parts.some((p) => p === '' || !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length === 1) return Math.round(nums[0] * 60);
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return null;
}

/** One-line summary of whichever run metrics are present, e.g. '5.2 mi · 44:30 · 820 ft'. */
export function runSummary(log: {
  distance: number | null;
  timeSeconds: number | null;
  elevationFt: number | null;
}): string {
  const parts: string[] = [];
  if (log.distance != null) parts.push(`${log.distance} mi`);
  if (log.timeSeconds != null) parts.push(formatDuration(log.timeSeconds));
  if (log.elevationFt != null) parts.push(`${log.elevationFt} ft`);
  return parts.join(' · ');
}
