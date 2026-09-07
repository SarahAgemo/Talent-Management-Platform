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
};

const GRANULARITY_OPTIONS = [
  { value: "day", label: "By day" }, { value: "week", label: "By week" },
  { value: "month", label: "By month" }, { value: "year", label: "By year" }
] as const;

function bucketFor(dateStr: string, granularity: string) {
  const d = new Date(dateStr);
  switch (granularity) {
    case "day": return format(startOfDay(d), "MMM d, yyyy");
    case "week": return format(startOfWeek(d), "'wk of' MMM d");
    case "year": return format(startOfYear(d), "yyyy");
    default: return format(startOfMonth(d), "MMM yyyy");
  }
}

function rateByField(rows: Row[], field: "program_name" | "sponsorship_type") {
  const byKey = new Map<string, { label: string; placed: number; total: number }>();
  for (const r of rows) {
    const raw = (r[field] ?? "Unspecified").toString().trim().replace(/\s+/g, " ");
    const normKey = raw.toLowerCase();
    const entry = byKey.get(normKey) ?? { label: raw, placed: 0, total: 0 };
    entry.total++;
    if (r.placement_status === "placed") entry.placed++;
    byKey.set(normKey, entry);
  }
  return Array.from(byKey.values()).map((v) => ({
    label: v.label, placed: v.placed, total: v.total, rate: v.total > 0 ? Math.round((v.placed / v.total) * 100) : 0
  }));
}

export default function DashboardClient({ rows }: { rows: Row[] }) {
  const [granularity, setGranularity] = useState<"day" | "week" | "month" | "year">("month");

  const monthlyData = useMemo(() => {
    const now = Date.now();

    // The pool this chart is about: actively job-seeking students, same
    // definition as the stat cards — excludes Further Skilling and
    // Disinterested, and excludes anyone who hasn't graduated yet (unless
    // they're already placed, which can happen with messy source dates).
    const eligible = rows.filter((r) => {
      if (r.placement_status === "further_skilling" || r.placement_status === "declined_withdrawn") return false;
      if (r.placement_status === "placed") return true;
      const gradTime = r.graduation_date ? new Date(r.graduation_date).getTime() : NaN;
      return r.graduation_date && !isNaN(gradTime) && gradTime <= now;
    });
    const eligibleTotal = eligible.length;

    // Bucket PLACED students by their actual placement_date — this is what
    // makes the chart grow as new placements are recorded, not just when
    // someone happens to graduate in a new month.
    const byBucket = new Map<string, { count: number; sortKey: number }>();
    let undated = 0;

    for (const r of eligible) {
      if (r.placement_status !== "placed") continue;
      const placedTime = r.placement_date ? new Date(r.placement_date).getTime() : NaN;
      const isUsable = r.placement_date && !isNaN(placedTime) && placedTime <= now;
      if (!isUsable) { undated++; continue; }
      const bucket = bucketFor(r.placement_date!, granularity);
      const entry = byBucket.get(bucket) ?? { count: 0, sortKey: placedTime };
      entry.count++;
      byBucket.set(bucket, entry);
    }

    const sorted = Array.from(byBucket.entries()).map(([bucket, v]) => ({ bucket, ...v })).sort((a, b) => a.sortKey - b.sortKey);

    let cumPlaced = 0;
    const result = sorted.map((b) => {
      cumPlaced += b.count;
      const unplacedCount = eligibleTotal - cumPlaced;
      return {
        bucket: b.bucket,
        placedCount: cumPlaced,
        unplacedCount,
        placedPct: eligibleTotal > 0 ? Math.round((cumPlaced / eligibleTotal) * 100) : 0
      };
    });

    // Placed students with no usable placement_date still count toward the
    // true total — they just can't sit on a dated timeline, so they land
    // in one final catch-all point instead of being silently dropped.
    if (undated > 0) {
      cumPlaced += undated;
      const unplacedCount = eligibleTotal - cumPlaced;
      result.push({
        bucket: "Placement Date Not Recorded",
        placedCount: cumPlaced,
        unplacedCount,
        placedPct: eligibleTotal > 0 ? Math.round((cumPlaced / eligibleTotal) * 100) : 0
      });
    }

    return result;
  }, [rows, granularity]);

  const programData = useMemo(() => rateByField(rows, "program_name"), [rows]);
  const sponsorshipData = useMemo(() => rateByField(rows, "sponsorship_type"), [rows]);

  const jobTitleData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      if (r.placement_status !== "placed" || !r.position_title) continue;
      counts.set(r.position_title, (counts.get(r.position_title) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [rows]);

  const finalPoint = monthlyData[monthlyData.length - 1];

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Placed vs Unplaced (Cumulative)</h2>
            <p className="text-xs text-accent">
              Tracks when placements actually happened — grows automatically as new placement dates are recorded.
              {finalPoint ? ` Reaches ${finalPoint.placedCount} placed / ${finalPoint.unplacedCount} unplaced by the final point.` : ""}
            </p>
          </div>
          <select value={granularity} onChange={(e) => setGranularity(e.target.value as any)} className="rounded-md border border-border px-3 py-1.5 text-sm">
            {GRANULARITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="mt-4"><PlacedVsUnplacedChart data={monthlyData} /></div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Placement Rate by Program</h2>
        <p className="text-xs text-accent">Percentage shown, with placed/total counts below and in the tooltip</p>
        <div className="mt-4"><PlacementRateBarChart data={programData} /></div>
        <CountGrid data={programData} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Placement Rate by Sponsorship Type</h2>
        <p className="text-xs text-accent">How placement outcomes compare across self-sponsored, scholarship, NGO-sponsored, etc.</p>
        <div className="mt-4"><PlacementRateBarChart data={sponsorshipData} barColor="#8C5B8C" /></div>
        <CountGrid data={sponsorshipData} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Top 10 Job Titles by Placements</h2>
        <p className="text-xs text-accent">Most common roles students have actually been placed into</p>
        <div className="mt-4">
          {jobTitleData.length > 0 ? <TopJobTitlesChart data={jobTitleData} /> : <p className="text-sm text-ink/40">No placements with a recorded job title yet.</p>}
        </div>
      </div>
    </div>
  );
}

function CountGrid({ data }: { data: { label: string; placed: number; total: number }[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/60 sm:grid-cols-3">
      {data.map((p) => (
        <div key={p.label} className="flex justify-between rounded-md bg-ink/[0.03] px-2 py-1">
          <span>{p.label}</span><span className="font-medium">{p.placed}/{p.total}</span>
        </div>
      ))}
    </div>
  );
}