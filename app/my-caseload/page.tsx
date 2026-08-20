export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PipelineView from "@/components/PipelineView";

export default async function MyCaseloadPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: kpi } = user
    ? await supabase.from("staff_kpi_overview").select("*").eq("staff_id", user.id).maybeSingle()
    : { data: null };

  const { data: cards } = user
    ? await supabase.from("student_pipeline_card").select("*").eq("assigned_to", user.id)
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">My Caseload</h1>
        <p className="text-sm text-accent">Your assigned students, pipeline stage, and readiness at a glance.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Placed / Allocated" value={`${kpi?.total_placed ?? 0} / ${kpi?.total_assigned ?? 0}`} primary />
        <KpiCard label="Interviewing" value={kpi?.total_interviewing ?? 0} />
        <KpiCard label="At Risk" value={kpi?.total_at_risk ?? 0} tone="warning" />
        <KpiCard label="Avg Weeks to Place" value={kpi?.avg_weeks_to_place ?? "—"} />
      </div>

      <PipelineView cards={(cards ?? []) as any} />
    </div>
  );
}

function KpiCard({ label, value, tone, primary }: { label: string; value: string | number; tone?: "warning"; primary?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${primary ? "text-brand" : tone === "warning" ? "text-warning" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
