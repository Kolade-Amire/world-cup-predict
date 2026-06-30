// West Africa Time is a fixed UTC+1 with no daylight saving, so we can convert
// with a constant offset instead of pulling in a timezone library.
const WAT_OFFSET_MINUTES = 60;

// Convert a "datetime-local" value the admin typed (which they mean as WAT)
// into a real UTC Date for storage.
export function watInputToUtc(local: string): Date {
  // local looks like "2026-07-04T21:00" with no zone. Parse the parts directly
  // so the browser's own timezone never enters into it.
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error("Invalid date/time");
  const [, y, mo, d, h, min] = m.map(Number) as unknown as number[];
  return new Date(Date.UTC(y, mo - 1, d, h, min) - WAT_OFFSET_MINUTES * 60_000);
}

// Format a stored UTC Date as a "datetime-local" string in WAT for editing.
export function utcToWatInput(date: Date): string {
  const wat = new Date(date.getTime() + WAT_OFFSET_MINUTES * 60_000);
  return wat.toISOString().slice(0, 16);
}

// Human-readable WAT label, e.g. "Sat 4 Jul, 21:00 WAT".
export function formatWat(date: Date): string {
  const wat = new Date(date.getTime() + WAT_OFFSET_MINUTES * 60_000);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = wat.getUTCDate();
  const hh = String(wat.getUTCHours()).padStart(2, "0");
  const mm = String(wat.getUTCMinutes()).padStart(2, "0");
  return `${days[wat.getUTCDay()]} ${dd} ${months[wat.getUTCMonth()]}, ${hh}:${mm} WAT`;
}

export function isLocked(kickoff: Date | null): boolean {
  if (!kickoff) return false; // not scheduled yet => predictions not open, handled separately
  return Date.now() >= kickoff.getTime();
}
