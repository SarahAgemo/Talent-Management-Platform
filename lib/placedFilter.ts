// "Placed in" filter for the Student Directory (and its export): students
// placed in a chosen year, month, week or day, counted exactly the way the
// Dashboard counts "Placements in this period":
//   - placement status is Placed, and
//   - the placement date falls inside the period and isn't in the future.
// "No date recorded" lists placed students with no placement date, or a date
// still in the future (the Dashboard's "Placement Date Not Recorded" row).
//
// A date range works the same way: placed between two dates, both included.
//
// URL parameters: placedYear (e.g. 2026, or "nodate"), placedMonth (1-12),
// placedWeek (1-6, the week of that month) and placedDay (YYYY-MM-DD); or
// placedFrom / placedTo (YYYY-MM-DD, either may be left out). A date range
// takes priority over the year / month / week / day lists.

import { resolvePeriod, toDayNumber, todayDayNumber, ymdFromDay, type PeriodChoice } from "./reportPeriods";

export const PLACED_PARAMS = ["placedYear", "placedMonth", "placedWeek", "placedDay"] as const;
export const RANGE_PARAMS = ["placedFrom", "placedTo"] as const;
export const NO_DATE = "nodate";

export type PlacedFilter =
  | { kind: "none" }
  | { kind: "nodate"; label: string; slug: string }
  | { kind: "period"; startDay: number; endDay: number; label: string; slug: string; choice: PeriodChoice }
  // endDay is the day after "to" (exclusive); null = open-ended on that side
  | { kind: "range"; startDay: number | null; endDay: number | null; label: string; slug: string };

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 21 Sep 2026
export function shortDate(day: number): string {
  const { y, m, d } = ymdFromDay(day);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function isoFromDay(day: number): string {
  const { y, m, d } = ymdFromDay(day);
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Today's date in Uganda, so the list, its export and the Dashboard (used in
// Kampala) agree on what counts as "not in the future", whatever time zone
// the server runs in.
export function ugandaTodayDayNumber(now: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Kampala", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const y = get("year"), m = get("month"), d = get("day");
    if (y && m && d) return toDayNumber(`${y}-${pad(m)}-${pad(d)}`) ?? todayDayNumber(now);
  } catch {
    // Very old browser without time-zone support: use the computer's date.
  }
  return todayDayNumber(now);
}

export function readPlacedFilter(get: (key: string) => string | null | undefined): PlacedFilter {
  let from = toDayNumber(get("placedFrom"));
  let to = toDayNumber(get("placedTo"));
  if (from !== null || to !== null) {
    if (from !== null && to !== null && from > to) [from, to] = [to, from];
    const label = from !== null && to !== null ? (from === to ? `on ${shortDate(from)}` : `between ${shortDate(from)} and ${shortDate(to)}`)
      : from !== null ? `from ${shortDate(from)} onward` : `up to ${shortDate(to as number)}`;
    const slug = from !== null && to !== null ? `${isoFromDay(from)}_to_${isoFromDay(to)}`
      : from !== null ? `from_${isoFromDay(from)}` : `up_to_${isoFromDay(to as number)}`;
    return { kind: "range", startDay: from, endDay: to !== null ? to + 1 : null, label, slug };
  }

  const year = get("placedYear");
  if (!year) return { kind: "none" };
  if (year === NO_DATE) return { kind: "nodate", label: "with no placement date recorded", slug: "no-date" };
  if (!/^\d{4}$/.test(year)) return { kind: "none" };
  const dayValue = get("placedDay");
  const day = dayValue ? toDayNumber(dayValue) : null;
  const choice: PeriodChoice = {
    year, month: get("placedMonth") || "all", week: get("placedWeek") || "all", day: day !== null ? String(day) : "all"
  };
  const resolved = resolvePeriod(choice, []);
  if (!resolved.period) return { kind: "none" };
  return { kind: "period", startDay: resolved.period.start, endDay: resolved.period.end, label: `in ${resolved.label}`, slug: resolved.fileSlug, choice };
}

// Adds the filter to a Supabase query on student_overview.
export function applyPlacedFilter(query: any, filter: PlacedFilter, today: number): any {
  if (filter.kind === "none") return query;
  const tomorrow = today + 1;
  const placed = query.eq("placement_status", "placed");
  if (filter.kind === "nodate") return placed.or(`placement_date.is.null,placement_date.gte.${isoFromDay(tomorrow)}`);
  const fromDay = filter.startDay;
  const withStart = fromDay !== null ? placed.gte("placement_date", isoFromDay(fromDay)) : placed;
  return withStart.lt("placement_date", isoFromDay(Math.min(filter.endDay ?? tomorrow, tomorrow)));
}

// Periods and date ranges list people in the order they were placed.
export function ordersByPlacementDate(filter: PlacedFilter): boolean {
  return filter.kind === "period" || filter.kind === "range";
}

// URL parameters that open the Student Directory on a period ("" values are left out).
export function placedQuery(params: { placedYear: string; placedMonth?: string; placedWeek?: string; placedDay?: string }): string {
  const q = new URLSearchParams();
  for (const key of PLACED_PARAMS) {
    const value = params[key];
    if (value) q.set(key, value);
  }
  return q.toString();
}
