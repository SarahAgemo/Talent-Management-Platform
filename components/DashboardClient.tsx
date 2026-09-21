"use client";
import { useMemo, useState } from "react";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format } from "date-fns";
import { PlacedVsUnplacedChart, PlacementRateBarChart, TopJobTitlesChart } from "./DashboardCharts";

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

const GRANULARITY_OPTIONS = [
  { value: "day", label: "By day" }, { value: "week", label: "By week" },
  { value: "month", label: "By month" }, { value: "year", label: "By year" }
] as const;

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
const STAFF_TRACKING_START = new Date("2026-08-01").getTime();

function bucketFor(dateStr: string, granularity: string) {
  const d = new Date(dateStr);
  switch (granularity) {
    case "day": return format(startOfDay(d), "MMM d, yyyy");
    case "week": return format(startOfWeek(d), "'wk of' MMM d");
    case "year": return format(startOfYear(d), "yyyy");
    default: return format(startOfMonth(d), "MMM yyyy");
  }
}

function isUsablePastDate(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return !isNaN(t) && t <= Date.now();
}

function rateByField(rows: Row[], field: "program_name" | "sponsorship_type", year: string) {
  const byKey = new Map<string, { label: string; placed: number; total: number }>();
  for (const r of rows) {
    const raw = (r[field] ?? "Unspecified").toString().trim().replace(/\s+/g, " ");
    const normKey = raw.toLowerCase();
    const entry = byKey.get(normKey) ?? { label: raw, placed: 0, total: 0 };
    entry.total++;
    if (r.placement_status === "placed") {
      if (year === "all") {
        entry.placed++;
      } else if (isUsablePastDate(r.placement_date) && new Date(r.placement_date!).getFullYear() === Number(year)) {
        entry.placed++;
      }
    }
    byKey.set(normKey, entry);
  }
  return Array.from(byKey.values()).map((v) => ({
    label: v.label, placed: v.placed, total: v.total, rate: v.total > 0 ? Math.round((v.placed / v.total) * 100) : 0
  }));
}

export default function DashboardClient({ rows }: { rows: Row[] }) {
  const [granularity, setGranularity] = useState<"day" | "week" | "month" | "year">("month");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const r of rows) {
      if (r.placement_status !== "placed" || !isUsablePastDate(r.placement_date)) continue;
      years.add(new Date(r.placement_date!).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [rows]);

  const eligible = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => {
      if (r.placement_status === "further_skilling" || r.placement_status === "declined_withdrawn") return false;
      if (r.placement_status === "placed") return true;
      const gradTime = r.graduation_date ? new Date(r.graduation_date).getTime() : NaN;
      return r.graduation_date && !isNaN(gradTime) && gradTime <= now;
    });
  }, [rows]);

  const eligibleTotal = eligible.length;

  const { fullCumulative, undatedCount } = useMemo(() => {
    const byBucket = new Map<string, { count: number; sortKey: number; year: number }>();
    let undated = 0;
    for (const r of eligible) {
      if (r.placement_status !== "placed") continue;
      if (!isUsablePastDate(r.placement_date)) { undated++; continue; }
      const bucket = bucketFor(r.placement_date!, granularity);
      const entry = byBucket.get(bucket) ?? { count: 0, sortKey: new Date(r.placement_date!).getTime(), year: new Date(r.placement_date!).getFullYear() };
      entry.count++;
      byBucket.set(bucket, entry);
    }
    const sorted = Array.from(byBucket.entries()).map(([bucket, v]) => ({ bucket, ...v })).sort((a, b) => a.sortKey - b.sortKey);
    let cumPlaced = 0;
    const full = sorted.map((b) => {
      cumPlaced += b.count;
      return { bucket: b.bucket, year: b.year, sortKey: b.sortKey, periodCount: b.count, placedCount: cumPlaced, unplacedCount: eligibleTotal - cumPlaced };
    });
    return { fullCumulative: full, undatedCount: undated };
  }, [eligible, granularity, eligibleTotal]);

  const monthlyData = useMemo(() => {
    const withPct = (arr: typeof fullCumulative) => arr.map((b) => ({
      ...b, placedPct: eligibleTotal > 0 ? Math.round((b.placedCount / eligibleTotal) * 100) : 0
    }));

    if (yearFilter === "all") {
      const base = withPct(fullCumulative);
      if (undatedCount > 0) {
        const last = base[base.length - 1];
        const placedCount = (last?.placedCount ?? 0) + undatedCount;
        base.push({
          bucket: "Placement Date Not Recorded", year: -1, sortKey: Infinity, periodCount: undatedCount,
          placedCount, unplacedCount: eligibleTotal - placedCount,
          placedPct: eligibleTotal > 0 ? Math.round((placedCount / eligibleTotal) * 100) : 0
        });
      }
      return base;
    }
    return withPct(fullCumulative.filter((b) => b.year === Number(yearFilter)));
  }, [fullCumulative, undatedCount, yearFilter, eligibleTotal]);

  // Table shows the chart's data as numbers, most recent periods first —
  // capped to 20 rows by default since a full multi-year history can run
  // to hundreds of daily/weekly rows. "Show all" reveals the complete list.
  const displayedTableRows = useMemo(() => {
    const reversed = [...monthlyData].reverse();
    return showAllPeriods ? reversed : reversed.slice(0, 20);
  }, [monthlyData, showAllPeriods]);

  // Staff Performance. Every placed student assigned to a staff member
  // lands in exactly one of three places on that staff member's row:
  //   - "Before Aug 2026": placed before allocation tracking began
  //   - a period column: placed from Aug 2026 onward (respects filters)
  //   - "Not Recorded": placed, but no usable placement date on file
  // Every staff member with at least one allocated student appears, even
  // with all zeros, so nobody with an active caseload is invisible.
  const staffPeriodData = useMemo(() => {
    type Agg = { earlier: number; notRecorded: number; buckets: Map<string, number> };
    const byStaff = new Map<string, Agg>();
    for (const r of rows) {
      if (r.assigned_staff_name && !byStaff.has(r.assigned_staff_name)) {
        byStaff.set(r.assigned_staff_name, { earlier: 0, notRecorded: 0, buckets: new Map() });
      }
    }

    const bucketOrder = new Map<string, number>();
    for (const r of rows) {
      if (r.placement_status !== "placed" || !r.assigned_staff_name) continue;
      const agg = byStaff.get(r.assigned_staff_name)!;
      if (!isUsablePastDate(r.placement_date)) { agg.notRecorded++; continue; }
      const t = new Date(r.placement_date!).getTime();
      if (t < STAFF_TRACKING_START) { agg.earlier++; continue; }
      if (yearFilter !== "all" && new Date(r.placement_date!).getFullYear() !== Number(yearFilter)) continue;
      const bucket = bucketFor(r.placement_date!, granularity);
      bucketOrder.set(bucket, Math.min(bucketOrder.get(bucket) ?? Infinity, t));
      agg.buckets.set(bucket, (agg.buckets.get(bucket) ?? 0) + 1);
    }

    const buckets = Array.from(bucketOrder.entries()).sort((a, b) => a[1] - b[1]).map(([b]) => b);

    const staffRows = Array.from(byStaff.entries()).map(([staffName, agg]) => {
      const counts = buckets.map((b) => agg.buckets.get(b) ?? 0);
      const periodTotal = counts.reduce((a, b) => a + b, 0);
      return { staffName, earlier: agg.earlier, counts, notRecorded: agg.notRecorded, total: agg.earlier + periodTotal + agg.notRecorded };
    }).sort((a, b) => b.total - a.total || a.staffName.localeCompare(b.staffName));

    const totals = {
      earlier: staffRows.reduce((a, s) => a + s.earlier, 0),
      counts: buckets.map((_, i) => staffRows.reduce((a, s) => a + s.counts[i], 0)),
      notRecorded: staffRows.reduce((a, s) => a + s.notRecorded, 0),
      total: staffRows.reduce((a, s) => a + s.total, 0)
    };

    return { buckets, staffRows, totals };
  }, [rows, granularity, yearFilter]);

  const programData = useMemo(() => rateByField(rows, "program_name", yearFilter), [rows, yearFilter]);
  const sponsorshipData = useMemo(() => rateByField(rows, "sponsorship_type", yearFilter), [rows, yearFilter]);

  const jobTitleData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      if (r.placement_status !== "placed" || !r.position_title) continue;
      if (yearFilter !== "all") {
        if (!isUsablePastDate(r.placement_date) || new Date(r.placement_date!).getFullYear() !== Number(yearFilter)) continue;
      }
      counts.set(r.position_title, (counts.get(r.position_title) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [rows, yearFilter]);

  const employmentTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      if (r.placement_status !== "placed" || !r.employment_type) continue;
      if (yearFilter !== "all") {
        if (!isUsablePastDate(r.placement_date) || new Date(r.placement_date!).getFullYear() !== Number(yearFilter)) continue;
      }
      counts.set(r.employment_type, (counts.get(r.employment_type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ title: EMPLOYMENT_TYPE_LABELS[type] ?? type, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows, yearFilter]);

  const finalPoint = monthlyData[monthlyData.length - 1];
  const periodNoun = { day: "Day", week: "Week", month: "Month", year: "Year" }[granularity];

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Placed vs Unplaced (Cumulative)</h2>
            <p className="text-xs text-accent">
              Tracks when placements actually happened, and refreshes automatically every time this page loads.
              {finalPoint ? ` Reaches ${finalPoint.placedCount} placed / ${finalPoint.unplacedCount} unplaced by the final point shown.` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
              <option value="all">All years</option>
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={granularity} onChange={(e) => setGranularity(e.target.value as any)} className="rounded-md border border-border px-3 py-1.5 text-sm">
              {GRANULARITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4"><PlacedVsUnplacedChart data={monthlyData} /></div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className="px-4 py-2">{periodNoun}</th>
                <th className="px-4 py-2">New Placements This Period</th>
                <th className="px-4 py-2">Placed (Cumulative)</th>
                <th className="px-4 py-2">Unplaced (Cumulative)</th>
                <th className="px-4 py-2">Placed %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedTableRows.map((b) => (
                <tr key={b.bucket}>
                  <td className="px-4 py-2 font-medium">{b.bucket}</td>
                  <td className="px-4 py-2 text-ink/70">{b.periodCount ?? "—"}</td>
                  <td className="px-4 py-2 text-success">{b.placedCount}</td>
                  <td className="px-4 py-2 text-danger">{b.unplacedCount}</td>
                  <td className="px-4 py-2 text-ink/70">{b.placedPct}%</td>
                </tr>
              ))}
              {monthlyData.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-ink/40">No placement data for this period.</td></tr>}
            </tbody>
          </table>
        </div>
        {monthlyData.length > 20 && (
          <button onClick={() => setShowAllPeriods(!showAllPeriods)} className="mt-2 text-sm font-medium text-accent hover:underline">
            {showAllPeriods ? "Show fewer" : `View more (${monthlyData.length - 20} earlier ${periodNoun.toLowerCase()}${monthlyData.length - 20 === 1 ? "" : "s"})`}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Staff Performance by Period</h2>
        <p className="text-xs text-accent">
          Placements per staff member's caseload. Period columns count placements from August 2026 onward per {granularity} (these respect the Year filter).
          &ldquo;Before Aug 2026&rdquo; and &ldquo;Not Recorded&rdquo; are all-time counts. Total = sum of the row.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className="sticky left-0 bg-brand/10 px-4 py-2">Staff</th>
                <th className="whitespace-nowrap px-4 py-2">Before Aug 2026</th>
                {staffPeriodData.buckets.map((b) => <th key={b} className="whitespace-nowrap px-4 py-2">{b}</th>)}
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
                  <td className="px-4 py-2 text-warning">{s.notRecorded || "—"}</td>
                  <td className="px-4 py-2 font-medium text-success">{s.total}</td>
                </tr>
              ))}
              {staffPeriodData.staffRows.length > 0 && (
                <tr className="bg-ink/[0.03] font-medium">
                  <td className="sticky left-0 bg-ink/[0.03] px-4 py-2">All staff</td>
                  <td className="px-4 py-2">{staffPeriodData.totals.earlier}</td>
                  {staffPeriodData.totals.counts.map((c, i) => <td key={i} className="px-4 py-2">{c}</td>)}
                  <td className="px-4 py-2">{staffPeriodData.totals.notRecorded}</td>
                  <td className="px-4 py-2 text-success">{staffPeriodData.totals.total}</td>
                </tr>
              )}
              {staffPeriodData.staffRows.length === 0 && (
                <tr><td colSpan={staffPeriodData.buckets.length + 4} className="px-4 py-6 text-center text-sm text-ink/40">No staff currently have students allocated to them.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand">Placement Rate by Program</h2>
          {yearFilter !== "all" && <span className="status-pill bg-brand/10 text-brand">Placements in {yearFilter} only</span>}
        </div>
        <p className="text-xs text-accent">Rate against the full program pool; placed count scoped to the year filter above.</p>
        <div className="mt-4"><PlacementRateBarChart data={programData} /></div>
        <RateTable data={programData} label="Program" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand">Placement Rate by Sponsorship Type</h2>
          {yearFilter !== "all" && <span className="status-pill bg-brand/10 text-brand">Placements in {yearFilter} only</span>}
        </div>
        <p className="text-xs text-accent">How placement outcomes compare across self-sponsored, scholarship, NGO-sponsored, etc.</p>
        <div className="mt-4"><PlacementRateBarChart data={sponsorshipData} barColor="#8C5B8C" /></div>
        <RateTable data={sponsorshipData} label="Sponsorship Type" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand">Employment Types</h2>
          {yearFilter !== "all" && <span className="status-pill bg-brand/10 text-brand">{yearFilter} only</span>}
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand">Top 10 Job Titles by Placements</h2>
          {yearFilter !== "all" && <span className="status-pill bg-brand/10 text-brand">{yearFilter} only</span>}
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
