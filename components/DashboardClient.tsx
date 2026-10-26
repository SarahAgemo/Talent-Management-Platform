"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PlacedVsUnplacedChart, PlacementRateBarChart, TopJobTitlesChart } from "./DashboardCharts";
import ExportButton from "./ExportButton";
import { exportWorkbook } from "@/lib/exportUtils";
import { NO_DATE, isoFromDay, placedQuery } from "@/lib/placedFilter";
import {
  MONTH_NAMES, monthBucket, resolvePeriod, todayDayNumber, toDayNumber, yearOf,
  type Bucket, type PeriodChoice
} from "@/lib/reportPeriods";

type Row = {
  program_name: string | null;
  graduation_date: string | null;
  placement_date: string | null;
  placement_status: string | null;
  position_title: string | null;
  sponsorship_type: string | null;
  assigned_staff_name: string | null;
  employment_type: string | null;
};

// A row plus its placement day (null = no usable date: missing, invalid or in the future).
type Item = { row: Row; day: number | null };

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", freelance: "Freelance / Gig Work",
  contract: "Contract", internship: "Internship", unpaid_internship: "Unpaid Internship",
  self_employed: "Self-Employed", further_skilling: "Further Skilling"
};

// Real cutoff for meaningful staff attribution — allocation tracking
// (assigning students to specific staff) only began in August 2026.
// Placements dated before this either have no real assigned staff or
// were backfilled without accurate attribution, so including them
// would misrepresent who actually did the work.
const STAFF_TRACKING_START = toDayNumber("2026-08-01") as number;

const ALL_TIME: PeriodChoice = { year: "all", month: "all", week: "all", day: "all" };

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

// How many of the (ascending) day numbers fall before `limit`.
function countBefore(sortedDays: number[], limit: number) {
  let lo = 0, hi = sortedDays.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedDays[mid] < limit) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// Placed in the chosen period? With no period (All years) every placed
// student counts, including those with no placement date on file.
function placedIn(item: Item, period: Bucket | null) {
  if (item.row.placement_status !== "placed") return false;
  if (!period) return true;
  return item.day !== null && item.day >= period.start && item.day < period.end;
}

function rateByField(items: Item[], field: "program_name" | "sponsorship_type", period: Bucket | null) {
  const byKey = new Map<string, { label: string; placed: number; total: number }>();
  for (const item of items) {
    const raw = (item.row[field] ?? "Unspecified").toString().trim().replace(/\s+/g, " ");
    const normKey = raw.toLowerCase();
    const entry = byKey.get(normKey) ?? { label: raw, placed: 0, total: 0 };
    entry.total++;
    if (placedIn(item, period)) entry.placed++;
    byKey.set(normKey, entry);
  }
  return Array.from(byKey.values()).map((v) => ({
    label: v.label, placed: v.placed, total: v.total, rate: v.total > 0 ? Math.round((v.placed / v.total) * 100) : 0
  }));
}

type PeriodRow = {
  bucket: string;
  periodCount: number | null;   // null = period hasn't started yet
  placedCount: number | null;
  unplacedCount: number | null;
  placedPct: number | null;
  drill: PeriodChoice | null;   // clicking the row opens this period
  namesHref: string | null;     // Student Directory listing the people placed in this row
};

// directoryQuery: the Dashboard's 10X / graduate view as Student Directory
// filters (e.g. "tenx=in&completion=graduated"), so "see names" links list
// exactly the people counted here.
export default function DashboardClient({ rows, scopeLabel = "", directoryQuery = "" }: { rows: Row[]; scopeLabel?: string; directoryQuery?: string }) {
  const [choice, setChoice] = useState<PeriodChoice>(ALL_TIME);
  const [downloading, setDownloading] = useState(false);
  const today = useMemo(() => todayDayNumber(), []);

  const items: Item[] = useMemo(() => rows.map((row) => {
    const d = toDayNumber(row.placement_date);
    return { row, day: d !== null && d <= today ? d : null };
  }), [rows, today]);

  // Years to offer: from the first year with a dated placement up to this year.
  const years = useMemo(() => {
    const thisYear = yearOf(today);
    let first = thisYear;
    for (const it of items) if (it.row.placement_status === "placed" && it.day !== null) first = Math.min(first, yearOf(it.day));
    return Array.from({ length: thisYear - first + 1 }, (_, i) => first + i);
  }, [items, today]);

  const resolved = useMemo(() => resolvePeriod(choice, years), [choice, years]);
  const period = resolved.period;

  const eligible = useMemo(() => {
    const now = Date.now();
    return items.filter(({ row: r }) => {
      if (r.placement_status === "further_skilling" || r.placement_status === "declined_withdrawn") return false;
      if (r.placement_status === "placed") return true;
      const gradTime = r.graduation_date ? new Date(r.graduation_date).getTime() : NaN;
      return r.graduation_date && !isNaN(gradTime) && gradTime <= now;
    });
  }, [items]);

  const eligibleTotal = eligible.length;

  const { placedDays, undatedCount } = useMemo(() => {
    const days: number[] = [];
    let undated = 0;
    for (const it of eligible) {
      if (it.row.placement_status !== "placed") continue;
      if (it.day === null) undated++; else days.push(it.day);
    }
    days.sort((a, b) => a - b);
    return { placedDays: days, undatedCount: undated };
  }, [eligible]);

  // Drill-down target for each breakdown row (one level deeper).
  const drillFor = (index: number, b: Bucket): PeriodChoice | null => {
    switch (resolved.level) {
      case "all": return { year: b.label, month: "all", week: "all", day: "all" };
      case "year": return { ...choice, month: String(index + 1), week: "all", day: "all" };
      case "month": return { ...choice, week: String(index + 1), day: "all" };
      case "week": return { ...choice, day: String(b.start) };
      default: return null;
    }
  };

  // Student Directory link for people placed in a period.
  const directoryHref = (placed: string) => `/students?${[directoryQuery, placed].filter(Boolean).join("&")}`;
  const namesFor = (index: number, b: Bucket) => {
    switch (resolved.level) {
      case "all": return directoryHref(placedQuery({ placedYear: b.label }));
      case "year": return directoryHref(placedQuery({ placedYear: choice.year, placedMonth: String(index + 1) }));
      case "month": return directoryHref(placedQuery({ placedYear: choice.year, placedMonth: choice.month, placedWeek: String(index + 1) }));
      default: return directoryHref(placedQuery({ placedYear: choice.year, placedMonth: choice.month, placedWeek: choice.week, placedDay: isoFromDay(b.start) }));
    }
  };
  const periodNamesHref = (() => {
    switch (resolved.level) {
      case "all": return directoryHref("status=placed");
      case "year": return directoryHref(placedQuery({ placedYear: choice.year }));
      case "month": return directoryHref(placedQuery({ placedYear: choice.year, placedMonth: choice.month }));
      case "week": return directoryHref(placedQuery({ placedYear: choice.year, placedMonth: choice.month, placedWeek: choice.week }));
      default: return directoryHref(placedQuery({ placedYear: choice.year, placedMonth: choice.month, placedWeek: choice.week, placedDay: period ? isoFromDay(period.start) : "" }));
    }
  })();

  // Placed vs Unplaced: one row per month / week / day of the chosen period.
  // "Placed (cumulative)" counts every dated placement up to the end of that
  // row, including earlier years; "Unplaced" is the rest of the eligible group.
  const periodRows: PeriodRow[] = useMemo(() => {
    const out: PeriodRow[] = resolved.children.map((b, i) => {
      if (b.start > today) {
        return { bucket: b.label, periodCount: null, placedCount: null, unplacedCount: null, placedPct: null, drill: null, namesHref: null };
      }
      const cumulative = countBefore(placedDays, b.end);
      return {
        bucket: b.label, periodCount: cumulative - countBefore(placedDays, b.start), placedCount: cumulative,
        unplacedCount: eligibleTotal - cumulative, placedPct: pct(cumulative, eligibleTotal), drill: drillFor(i, b), namesHref: namesFor(i, b)
      };
    });
    if (resolved.level === "all" && undatedCount > 0) {
      const placedCount = placedDays.length + undatedCount;
      out.push({
        bucket: "Placement Date Not Recorded", periodCount: undatedCount, placedCount,
        unplacedCount: eligibleTotal - placedCount, placedPct: pct(placedCount, eligibleTotal), drill: null,
        namesHref: directoryHref(placedQuery({ placedYear: NO_DATE }))
      });
    }
    return out;
  }, [resolved, placedDays, undatedCount, eligibleTotal, today, choice, directoryQuery]);

  // Headline figures for the whole chosen period.
  const summary = useMemo(() => {
    if (!period) {
      const placed = placedDays.length + undatedCount;
      return { upcoming: false, newPlacements: placed, placedByEnd: placed, unplacedAtEnd: eligibleTotal - placed, placedPct: pct(placed, eligibleTotal) };
    }
    if (period.start > today) return { upcoming: true, newPlacements: null, placedByEnd: null, unplacedAtEnd: null, placedPct: null };
    const cumulative = countBefore(placedDays, period.end);
    return {
      upcoming: false, newPlacements: cumulative - countBefore(placedDays, period.start), placedByEnd: cumulative,
      unplacedAtEnd: eligibleTotal - cumulative, placedPct: pct(cumulative, eligibleTotal)
    };
  }, [period, placedDays, undatedCount, eligibleTotal, today]);

  // Staff Performance. Every placed student assigned to a staff member
  // lands in exactly one of three places on that staff member's row:
  //   - "Before Aug 2026": placed before allocation tracking began
  //   - a period column: placed from Aug 2026 onward, inside the chosen period
  //   - "Not Recorded": placed, but no usable placement date on file
  // Every staff member with at least one allocated student appears, even
  // with all zeros, so nobody with an active caseload is invisible.
  const staffPeriodData = useMemo(() => {
    const columns = resolved.children.filter((b) => b.end > STAFF_TRACKING_START);
    type Agg = { earlier: number; notRecorded: number; counts: number[] };
    const byStaff = new Map<string, Agg>();
    for (const { row } of items) {
      if (row.assigned_staff_name && !byStaff.has(row.assigned_staff_name)) {
        byStaff.set(row.assigned_staff_name, { earlier: 0, notRecorded: 0, counts: columns.map(() => 0) });
      }
    }
    for (const { row, day } of items) {
      if (row.placement_status !== "placed" || !row.assigned_staff_name) continue;
      const agg = byStaff.get(row.assigned_staff_name)!;
      if (day === null) { agg.notRecorded++; continue; }
      if (day < STAFF_TRACKING_START) { agg.earlier++; continue; }
      const i = columns.findIndex((b) => day >= b.start && day < b.end);
      if (i >= 0) agg.counts[i]++;
    }

    const staffRows = Array.from(byStaff.entries()).map(([staffName, agg]) => {
      const periodTotal = agg.counts.reduce((a, b) => a + b, 0);
      return { staffName, earlier: agg.earlier, counts: agg.counts, periodTotal, notRecorded: agg.notRecorded, total: agg.earlier + periodTotal + agg.notRecorded };
    }).sort((a, b) => b.total - a.total || a.staffName.localeCompare(b.staffName));

    const totals = {
      earlier: staffRows.reduce((a, s) => a + s.earlier, 0),
      counts: columns.map((_, i) => staffRows.reduce((a, s) => a + s.counts[i], 0)),
      periodTotal: staffRows.reduce((a, s) => a + s.periodTotal, 0),
      notRecorded: staffRows.reduce((a, s) => a + s.notRecorded, 0),
      total: staffRows.reduce((a, s) => a + s.total, 0)
    };

    return { columns, staffRows, totals };
  }, [items, resolved]);

  const programData = useMemo(() => rateByField(items, "program_name", period), [items, period]);
  const sponsorshipData = useMemo(() => rateByField(items, "sponsorship_type", period), [items, period]);

  const jobTitleData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      if (!it.row.position_title || !placedIn(it, period)) continue;
      counts.set(it.row.position_title, (counts.get(it.row.position_title) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [items, period]);

  const employmentTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      if (!it.row.employment_type || !placedIn(it, period)) continue;
      counts.set(it.row.employment_type, (counts.get(it.row.employment_type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ title: EMPLOYMENT_TYPE_LABELS[type] ?? type, count }))
      .sort((a, b) => b.count - a.count);
  }, [items, period]);

  // ------------------------------------------------------------------ downloads
  const noun = resolved.childNoun;
  const slug = resolved.fileSlug;
  const blank = (v: number | null) => (v === null ? "" : v);

  const exports = useMemo(() => {
    const placedVsUnplaced = periodRows.map((r) => ({
      [noun]: r.bucket, "New placements": blank(r.periodCount), "Placed (cumulative)": blank(r.placedCount),
      "Unplaced (cumulative)": blank(r.unplacedCount), "Placed %": blank(r.placedPct)
    }));
    const staffRow = (name: string, s: { earlier: number; counts: number[]; periodTotal: number; notRecorded: number; total: number }) => {
      const out: Record<string, string | number> = { Staff: name, "Before Aug 2026": s.earlier };
      // A column named only with digits ("2026") would be moved to the front of
      // the file, so year columns are written as "Year 2026".
      staffPeriodData.columns.forEach((b, i) => { out[/^\d+$/.test(b.label) ? `Year ${b.label}` : b.label] = s.counts[i]; });
      out["Period total"] = s.periodTotal;
      out["Not recorded"] = s.notRecorded;
      out["Total"] = s.total;
      return out;
    };
    const staff = staffPeriodData.staffRows.map((s) => staffRow(s.staffName, s));
    if (staff.length > 0) staff.push(staffRow("All staff", staffPeriodData.totals));
    const rates = (data: typeof programData, label: string) => [...data].sort((a, b) => b.rate - a.rate)
      .map((p) => ({ [label]: p.label, Placed: p.placed, Total: p.total, "Rate %": p.rate }));
    return {
      placedVsUnplaced, staff,
      program: rates(programData, "Program"),
      sponsorship: rates(sponsorshipData, "Sponsorship type"),
      employment: employmentTypeData.map((e) => ({ "Employment type": e.title, Placements: e.count })),
      jobs: jobTitleData.map((j) => ({ "Job title": j.title, Placements: j.count }))
    };
  }, [periodRows, staffPeriodData, programData, sponsorshipData, employmentTypeData, jobTitleData, noun]);

  async function downloadReport() {
    setDownloading(true);
    try {
      const upcoming = "Not reached yet";
      const summaryRows = [
        { Item: "Report period", Value: resolved.label },
        { Item: "Broken down by", Value: resolved.level === "day" ? "Single day" : noun.toLowerCase() },
        { Item: "Participants included", Value: scopeLabel || "As filtered on the dashboard" },
        { Item: "Placements in this period", Value: summary.newPlacements ?? upcoming },
        { Item: "Placed by the end of the period (cumulative)", Value: summary.placedByEnd ?? upcoming },
        { Item: "Unplaced at the end of the period", Value: summary.unplacedAtEnd ?? upcoming },
        { Item: "Placed % at the end of the period", Value: summary.placedPct === null ? upcoming : `${summary.placedPct}%` },
        { Item: "Participants counted for placed / unplaced", Value: eligibleTotal },
        { Item: "Downloaded", Value: new Date().toLocaleString("en-GB") },
        { Item: "Note", Value: "Placements with no date recorded are only counted under All years. Staff placements before 1 Aug 2026 are grouped under 'Before Aug 2026'." }
      ];
      await exportWorkbook([
        { name: "Summary", rows: summaryRows },
        { name: "Placed vs Unplaced", rows: exports.placedVsUnplaced },
        { name: "Staff performance", rows: exports.staff },
        { name: "By program", rows: exports.program },
        { name: "By sponsorship", rows: exports.sponsorship },
        { name: "Employment types", rows: exports.employment },
        { name: "Top job titles", rows: exports.jobs }
      ], `placement_report_${slug}`);
    } finally {
      setDownloading(false);
    }
  }

  // ------------------------------------------------------------------ period picker
  const selectedYear = resolved.level === "all" ? null : Number(choice.year);
  const setYear = (year: string) => setChoice({ year, month: "all", week: "all", day: "all" });
  const setMonth = (month: string) => setChoice((c) => ({ ...c, month, week: "all", day: "all" }));
  const setWeek = (week: string) => setChoice((c) => ({ ...c, week, day: "all" }));
  const setDay = (day: string) => setChoice((c) => ({ ...c, day }));

  const crumbs: { label: string; target: PeriodChoice }[] = [{ label: "All years", target: ALL_TIME }];
  if (selectedYear !== null) crumbs.push({ label: String(selectedYear), target: { year: choice.year, month: "all", week: "all", day: "all" } });
  if (resolved.level === "month" || resolved.level === "week" || resolved.level === "day") {
    crumbs.push({ label: MONTH_NAMES[Number(choice.month) - 1], target: { ...choice, week: "all", day: "all" } });
  }
  if (resolved.level === "week" || resolved.level === "day") {
    crumbs.push({ label: `Week ${choice.week}`, target: { ...choice, day: "all" } });
  }
  if (resolved.level === "day") crumbs.push({ label: resolved.children[0].label, target: choice });

  const periodPill = period ? resolved.label : null;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Reporting period</h2>
            <p className="text-xs text-accent">
              Choose a year to see its 12 months, then a month to see its weeks, then a week to see its days.
              Every section below follows this period.
            </p>
          </div>
          <button onClick={downloadReport} disabled={downloading}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            {downloading ? "Preparing…" : "Download report (Excel)"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <PeriodSelect label="Year" value={choice.year} onChange={setYear}>
            <option value="all">All years</option>
            {[...years].reverse().map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </PeriodSelect>
          <PeriodSelect label="Month" value={selectedYear === null ? "all" : choice.month} onChange={setMonth} disabled={selectedYear === null}>
            <option value="all">{selectedYear === null ? "Choose a year first" : "All 12 months"}</option>
            {selectedYear !== null && MONTH_NAMES.map((name, i) => (
              <option key={name} value={String(i + 1)} disabled={monthBucket(selectedYear, i + 1).start > today}>{name}</option>
            ))}
          </PeriodSelect>
          <PeriodSelect label="Week" value={resolved.weeks.length ? choice.week : "all"} onChange={setWeek} disabled={resolved.weeks.length === 0}>
            <option value="all">{resolved.weeks.length ? "All weeks" : "Choose a month first"}</option>
            {resolved.weeks.map((w, i) => <option key={w.key} value={String(i + 1)} disabled={w.start > today}>{w.label}</option>)}
          </PeriodSelect>
          <PeriodSelect label="Day" value={resolved.days.length ? choice.day : "all"} onChange={setDay} disabled={resolved.days.length === 0}>
            <option value="all">{resolved.days.length ? "All days" : "Choose a week first"}</option>
            {resolved.days.map((d) => <option key={d.key} value={String(d.start)} disabled={d.start > today}>{d.label}</option>)}
          </PeriodSelect>
        </div>

        <nav aria-label="Reporting period" className="mt-3 flex flex-wrap items-center gap-1 text-sm">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className="text-ink/30">›</span>}
              {i === crumbs.length - 1
                ? <span className="font-semibold text-brand">{c.label}</span>
                : <button onClick={() => setChoice(c.target)} className="text-ink/60 hover:text-brand hover:underline">{c.label}</button>}
            </span>
          ))}
          <span className="ml-1 text-xs text-ink/50">
            {resolved.level === "day" ? "· single day" : `· broken down by ${noun.toLowerCase()}`}
          </span>
        </nav>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Placements in this period" value={summary.newPlacements} className="text-brand"
            href={summary.newPlacements ? periodNamesHref : undefined} />
          <MiniStat label="Placed by end of period" value={summary.placedByEnd} className="text-success" />
          <MiniStat label="Unplaced at end of period" value={summary.unplacedAtEnd} className="text-danger" />
          <MiniStat label="Placed % at end of period" value={summary.placedPct} suffix="%" className="text-ink" />
        </div>
        {summary.upcoming && <p className="mt-2 text-xs text-ink/50">This period hasn&apos;t started yet.</p>}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-brand">Placed vs Unplaced (Cumulative)</h2>
            <p className="text-xs text-accent">
              {resolved.level === "day" ? `${resolved.label}.` : `${resolved.label}, by ${noun.toLowerCase()}.`} Placed (cumulative) counts every placement up to the end of each {noun.toLowerCase()}, including earlier years.
              {resolved.level !== "day" && " Click a row to open it."} Click a number of new placements to see those students.
            </p>
          </div>
          <ExportButton data={exports.placedVsUnplaced} filename={`placed_vs_unplaced_${slug}`} />
        </div>
        <div className="mt-4"><PlacedVsUnplacedChart data={periodRows} /></div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className="px-4 py-2">{noun}</th>
                <th className="px-4 py-2">New Placements This {noun}</th>
                <th className="px-4 py-2">Placed (Cumulative)</th>
                <th className="px-4 py-2">Unplaced (Cumulative)</th>
                <th className="px-4 py-2">Placed %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {periodRows.map((b) => (
                <tr key={b.bucket} className={b.drill ? "hover:bg-brand/5" : undefined}>
                  <td className="px-4 py-2 font-medium">
                    {b.drill ? (
                      <button onClick={() => setChoice(b.drill!)} className="inline-flex items-center gap-1 text-left hover:text-brand hover:underline">
                        {b.bucket} <span aria-hidden className="text-ink/40">›</span>
                      </button>
                    ) : (
                      <span className={b.periodCount === null ? "text-ink/40" : undefined}>{b.bucket}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink/70">
                    {b.namesHref && b.periodCount ? (
                      <Link href={b.namesHref} title="See these students in the Student Directory" className="font-medium text-accent hover:underline">{b.periodCount}</Link>
                    ) : (b.periodCount ?? "—")}
                  </td>
                  <td className="px-4 py-2 text-success">{b.placedCount ?? "—"}</td>
                  <td className="px-4 py-2 text-danger">{b.unplacedCount ?? "—"}</td>
                  <td className="px-4 py-2 text-ink/70">{b.placedPct === null ? "—" : `${b.placedPct}%`}</td>
                </tr>
              ))}
              {periodRows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-ink/40">No placement data for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-brand">Staff Performance by Period</h2>
            <p className="text-xs text-accent">
              Placements per staff member&apos;s caseload for {resolved.level === "day" ? resolved.label : `${resolved.label}, by ${noun.toLowerCase()}`}. Columns start from August 2026, when allocation tracking began.
              &ldquo;Before Aug 2026&rdquo; and &ldquo;Not Recorded&rdquo; are all-time counts. Total = sum of the row.
            </p>
          </div>
          <ExportButton data={exports.staff} filename={`staff_performance_${slug}`} />
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className="sticky-cell-head sticky left-0 px-4 py-2">Staff</th>
                <th className="whitespace-nowrap px-4 py-2">Before Aug 2026</th>
                {staffPeriodData.columns.map((b) => <th key={b.key} className="whitespace-nowrap px-4 py-2">{b.label}</th>)}
                <th className="whitespace-nowrap px-4 py-2">Period Total</th>
                <th className="whitespace-nowrap px-4 py-2">Not Recorded</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffPeriodData.staffRows.map((s) => (
                <tr key={s.staffName}>
                  <td className="sticky left-0 bg-surface px-4 py-2 font-medium">{s.staffName}</td>
                  <td className="px-4 py-2 text-ink/50">{s.earlier || "—"}</td>
                  {s.counts.map((c, i) => <td key={i} className="px-4 py-2 text-ink/70">{c || "—"}</td>)}
                  <td className="px-4 py-2 font-medium text-brand">{s.periodTotal || "—"}</td>
                  <td className="px-4 py-2 text-warning">{s.notRecorded || "—"}</td>
                  <td className="px-4 py-2 font-medium text-success">{s.total}</td>
                </tr>
              ))}
              {staffPeriodData.staffRows.length > 0 && (
                <tr className="bg-ink/[0.03] font-medium">
                  <td className="sticky-cell-total sticky left-0 px-4 py-2">All staff</td>
                  <td className="px-4 py-2">{staffPeriodData.totals.earlier}</td>
                  {staffPeriodData.totals.counts.map((c, i) => <td key={i} className="px-4 py-2">{c}</td>)}
                  <td className="px-4 py-2 text-brand">{staffPeriodData.totals.periodTotal}</td>
                  <td className="px-4 py-2">{staffPeriodData.totals.notRecorded}</td>
                  <td className="px-4 py-2 text-success">{staffPeriodData.totals.total}</td>
                </tr>
              )}
              {staffPeriodData.staffRows.length === 0 && (
                <tr><td colSpan={staffPeriodData.columns.length + 5} className="px-4 py-6 text-center text-sm text-ink/40">No staff currently have students allocated to them.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-brand">Placement Rate by Program</h2>
          <div className="flex items-center gap-2">
            {periodPill && <span className="status-pill bg-brand/10 text-brand">Placements in {periodPill} only</span>}
            <ExportButton data={exports.program} filename={`placement_rate_by_program_${slug}`} />
          </div>
        </div>
        <p className="text-xs text-accent">Rate against the full program pool; placed count scoped to the reporting period above.</p>
        <div className="mt-4"><PlacementRateBarChart data={programData} /></div>
        <RateTable data={programData} label="Program" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-brand">Placement Rate by Sponsorship Type</h2>
          <div className="flex items-center gap-2">
            {periodPill && <span className="status-pill bg-brand/10 text-brand">Placements in {periodPill} only</span>}
            <ExportButton data={exports.sponsorship} filename={`placement_rate_by_sponsorship_${slug}`} />
          </div>
        </div>
        <p className="text-xs text-accent">How placement outcomes compare across self-sponsored, scholarship, NGO-sponsored, etc.</p>
        <div className="mt-4"><PlacementRateBarChart data={sponsorshipData} tone="brandSoft" /></div>
        <RateTable data={sponsorshipData} label="Sponsorship Type" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-brand">Employment Types</h2>
          <div className="flex items-center gap-2">
            {periodPill && <span className="status-pill bg-brand/10 text-brand">{periodPill} only</span>}
            {employmentTypeData.length > 0 && <ExportButton data={exports.employment} filename={`employment_types_${slug}`} />}
          </div>
        </div>
        <p className="text-xs text-accent">What kind of work placed students actually landed — full-time, freelance, self-employed, etc.</p>
        <div className="mt-4">
          {employmentTypeData.length > 0 ? <TopJobTitlesChart data={employmentTypeData} /> : <p className="text-sm text-ink/40">No placements with a recorded employment type yet for this period.</p>}
        </div>
        {employmentTypeData.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                <tr><th className="px-4 py-2">Employment Type</th><th className="px-4 py-2">Placements</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employmentTypeData.map((e) => (
                  <tr key={e.title}><td className="px-4 py-2 font-medium">{e.title}</td><td className="px-4 py-2 text-ink/70">{e.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-brand">Top 10 Job Titles by Placements</h2>
          <div className="flex items-center gap-2">
            {periodPill && <span className="status-pill bg-brand/10 text-brand">{periodPill} only</span>}
            {jobTitleData.length > 0 && <ExportButton data={exports.jobs} filename={`top_job_titles_${slug}`} />}
          </div>
        </div>
        <p className="text-xs text-accent">Most common roles students have actually been placed into</p>
        <div className="mt-4">
          {jobTitleData.length > 0 ? <TopJobTitlesChart data={jobTitleData} /> : <p className="text-sm text-ink/40">No placements with a recorded job title yet for this period.</p>}
        </div>
        {jobTitleData.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                <tr><th className="px-4 py-2">Job Title</th><th className="px-4 py-2">Placements</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobTitleData.map((j) => (
                  <tr key={j.title}><td className="px-4 py-2 font-medium">{j.title}</td><td className="px-4 py-2 text-ink/70">{j.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodSelect({ label, value, onChange, disabled, children }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/60">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50">
        {children}
      </select>
    </label>
  );
}

function MiniStat({ label, value, suffix = "", className, href }: { label: string; value: number | null; suffix?: string; className?: string; href?: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${className ?? ""}`}>{value === null ? "—" : `${value}${suffix}`}</p>
      {href && <Link href={href} className="mt-1 inline-block text-xs font-medium text-accent hover:underline">See names &rarr;</Link>}
    </div>
  );
}

function RateTable({ data, label }: { data: { label: string; placed: number; total: number; rate: number }[]; label: string }) {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
          <tr><th className="px-4 py-2">{label}</th><th className="px-4 py-2">Placed</th><th className="px-4 py-2">Total</th><th className="px-4 py-2">Rate</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((p) => (
            <tr key={p.label}>
              <td className="px-4 py-2 font-medium">{p.label}</td>
              <td className="px-4 py-2 text-success">{p.placed}</td>
              <td className="px-4 py-2 text-ink/70">{p.total}</td>
              <td className="px-4 py-2 text-ink/70">{p.rate}%</td>
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-ink/40">No data.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
