// Reporting periods for the dashboard: Year -> Month -> Week -> Day.
//
// Dates are handled as whole calendar days ("day numbers" = days since
// 1 Jan 1970), read straight from the YYYY-MM-DD text in the database, so a
// placement dated 5 Oct always counts on 5 Oct whatever the computer's time
// zone. Every period runs from its first day up to (not including) `end`.
//
// Weeks run Monday to Sunday and are cut at the month's edges, so the weeks
// of a month always add up exactly to the month (Week 1 can be short).

export type Bucket = { key: string; label: string; start: number; end: number };
export type Level = "all" | "year" | "month" | "week" | "day";
export type PeriodChoice = { year: string; month: string; week: string; day: string }; // "all" or a value

const DAY_MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (n: number) => String(n).padStart(2, "0");

export function dayFromYMD(y: number, m: number, d: number): number {
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function ymdFromDay(n: number) {
  const dt = new Date(n * DAY_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), weekday: dt.getUTCDay() };
}

// "2026-10-05" (or "2026-10-05T..." ) -> day number; null when missing or invalid.
export function toDayNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const n = dayFromYMD(y, mo, d);
    return ymdFromDay(n).m === mo ? n : null; // rejects dates like 31 Feb
  }
  const t = new Date(value);
  return isNaN(t.getTime()) ? null : dayFromYMD(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

export function todayDayNumber(now: Date = new Date()): number {
  return dayFromYMD(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function yearOf(day: number): number {
  return ymdFromDay(day).y;
}

export function yearBucket(y: number): Bucket {
  return { key: String(y), label: String(y), start: dayFromYMD(y, 1, 1), end: dayFromYMD(y + 1, 1, 1) };
}

export function monthBucket(y: number, m: number): Bucket {
  return {
    key: `${y}-${pad(m)}`, label: `${MONTHS[m - 1]} ${y}`,
    start: dayFromYMD(y, m, 1), end: m === 12 ? dayFromYMD(y + 1, 1, 1) : dayFromYMD(y, m + 1, 1)
  };
}

export function monthBuckets(y: number): Bucket[] {
  return Array.from({ length: 12 }, (_, i) => monthBucket(y, i + 1));
}

function rangeText(first: number, last: number): string {
  const a = ymdFromDay(first), b = ymdFromDay(last);
  // Plain hyphen (not an en dash) so CSV downloads open cleanly in Excel.
  return first === last ? `${a.d} ${MONTHS[a.m - 1]}` : `${a.d}-${b.d} ${MONTHS[b.m - 1]}`;
}

// Monday-to-Sunday weeks inside one month, numbered from 1.
export function weekBuckets(y: number, m: number): Bucket[] {
  const month = monthBucket(y, m);
  const weeks: Bucket[] = [];
  let start = month.start;
  let i = 1;
  while (start < month.end) {
    const weekday = ymdFromDay(start).weekday; // 0 = Sunday
    const daysToNextMonday = (8 - weekday) % 7 || 7;
    const end = Math.min(start + daysToNextMonday, month.end);
    weeks.push({ key: `${month.key}-w${i}`, label: `Week ${i} (${rangeText(start, end - 1)})`, start, end });
    start = end;
    i++;
  }
  return weeks;
}

export function dayBucket(day: number): Bucket {
  const { y, m, d, weekday } = ymdFromDay(day);
  return { key: `${y}-${pad(m)}-${pad(d)}`, label: `${WEEKDAYS[weekday]} ${d} ${MONTHS[m - 1]}`, start: day, end: day + 1 };
}

export function dayBuckets(week: Bucket): Bucket[] {
  const out: Bucket[] = [];
  for (let n = week.start; n < week.end; n++) out.push(dayBucket(n));
  return out;
}

export type Resolved = {
  level: Level;
  period: Bucket | null;   // null = all time
  children: Bucket[];      // the rows / columns to break the period into
  label: string;           // e.g. "October 2026"
  childNoun: string;       // "Year" | "Month" | "Week" | "Day"
  fileSlug: string;        // used in download file names
  weeks: Bucket[];         // options for the Week list (when a month is chosen)
  days: Bucket[];          // options for the Day list (when a week is chosen)
};

// Turns the four dropdown values into the period and its breakdown.
// Any choice that doesn't fit its parent (e.g. a week number the month
// doesn't have) is treated as "all".
export function resolvePeriod(choice: PeriodChoice, yearsForAll: number[]): Resolved {
  const year = choice.year === "all" ? null : Number(choice.year);
  if (year === null || !Number.isInteger(year)) {
    const years = [...yearsForAll].sort((a, b) => a - b);
    return { level: "all", period: null, children: years.map(yearBucket), label: "All years", childNoun: "Year", fileSlug: "all-years", weeks: [], days: [] };
  }
  const month = choice.month === "all" ? null : Number(choice.month);
  if (month === null || !Number.isInteger(month) || month < 1 || month > 12) {
    return { level: "year", period: yearBucket(year), children: monthBuckets(year), label: String(year), childNoun: "Month", fileSlug: String(year), weeks: [], days: [] };
  }
  const monthB = monthBucket(year, month);
  const weeks = weekBuckets(year, month);
  const monthLabel = `${MONTHS_LONG[month - 1]} ${year}`;
  const weekIndex = choice.week === "all" ? null : Number(choice.week);
  const week = weekIndex !== null && Number.isInteger(weekIndex) ? weeks[weekIndex - 1] : undefined;
  if (!week) {
    return { level: "month", period: monthB, children: weeks, label: monthLabel, childNoun: "Week", fileSlug: monthB.key, weeks, days: [] };
  }
  const days = dayBuckets(week);
  const weekLabel = `${week.label.replace(")", ` ${year})`)}`;
  const dayNum = choice.day === "all" ? null : Number(choice.day);
  const day = dayNum !== null ? days.find((d) => d.start === dayNum) : undefined;
  if (!day) {
    return { level: "week", period: week, children: days, label: weekLabel, childNoun: "Day", fileSlug: `${monthB.key}-week${weekIndex}`, weeks, days };
  }
  const { d, weekday } = ymdFromDay(day.start);
  return {
    level: "day", period: day, children: [day], label: `${WEEKDAYS_LONG[weekday]} ${d} ${monthLabel}`,
    childNoun: "Day", fileSlug: day.key, weeks, days
  };
}

export const MONTH_NAMES = MONTHS_LONG;
