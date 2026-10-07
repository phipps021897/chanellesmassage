// Chanelle's hours alternate on a 2-week cycle starting Monday 12 October
// 2026 ("Week 1"). The following Monday (19 October) starts "Week 2", then
// it repeats: 12 Oct = Week 1, 19 Oct = Week 2, 26 Oct = Week 1, etc.
// Dates before this anchor use the old single-week schedule instead (see
// `business_hours` vs `biweekly_hours` in supabase/schema.sql).
export const BIWEEKLY_ANCHOR_DATE = '2026-10-12';

function atMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOnOrAfterAnchor(date: Date, anchor: string = BIWEEKLY_ANCHOR_DATE): boolean {
  const anchorDate = atMidnight(new Date(`${anchor}T00:00:00`));
  return atMidnight(date).getTime() >= anchorDate.getTime();
}

/** Returns 1 or 2 for any date on/after the anchor (handles dates before it too, just in case). */
export function getWeekNumberForDate(date: Date, anchor: string = BIWEEKLY_ANCHOR_DATE): 1 | 2 {
  const anchorDate = atMidnight(new Date(`${anchor}T00:00:00`));
  const target = atMidnight(date);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSince = Math.round((target.getTime() - anchorDate.getTime()) / msPerDay);
  const weeksSince = Math.floor(daysSince / 7);
  const mod = ((weeksSince % 2) + 2) % 2;
  return mod === 0 ? 1 : 2;
}
