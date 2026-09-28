/**export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";
import StaffAccountabilityTable from "@/components/StaffAccountabilityTable";
import Link from "next/link";

async function fetchAllStudentRows(supabase: any) {
  const pageSize = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("student_overview")
      .select("program_name, graduation_date, placement_date, placement_status, position_title, sponsorship_type, assigned_staff_name, employment_type")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const data = await fetchAllStudentRows(supabase);

  const { data: staffKpis } = await supabase.from("staff_kpi_overview").select("*").order("staff_name");

  const totalPlaced = data.filter((r) => r.placement_status === "placed").length;
  const totalFurtherSkilling = data.filter((r) => r.placement_status === "further_skilling").length;
  const totalDisinterested = data.filter((r) => r.placement_status === "declined_withdrawn").length;
  const totalUnplaced = data.length - totalPlaced - totalFurtherSkilling - totalDisinterested;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Dashboard</h1>
        <p className="text-sm text-accent">Placement performance across all graduates. Visible to Admins and Officers alike.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total graduates tracked" value={data.length} />
        <StatCard label="Placed" value={totalPlaced} tone="success" />
        <StatCard label="Unplaced" value={totalUnplaced} tone="warning" />
        <StatCard label="Further Skilling" value={totalFurtherSkilling} tone="purple" />
        <StatCard label="Disinterested in Work" value={totalDisinterested} tone="danger" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Staff Accountability Overview</h2>
        <p className="text-xs text-accent">Current snapshot — placed against each staff member's actual caseload right now.</p>
        <div className="mt-3">
          <StaffAccountabilityTable staffKpis={(staffKpis ?? []) as any} />
        </div>
        <Link href="/my-caseload" className="mt-3 inline-block text-sm text-accent hover:underline">View your own caseload &rarr;</Link>
      </div>

      <DashboardClient rows={data as any} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "purple" | "danger" }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "purple" ? "text-purple-700" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
**/

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";
import StaffAccountabilityTable from "@/components/StaffAccountabilityTable";
import Link from "next/link";

// Reads every row in stable pages. The student_id ordering matters: without
// a unique order the database may return overlapping pages, which double
// counts some students and silently drops others.
async function fetchAllStudentRows(supabase: any) {
  const pageSize = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("student_overview")
      .select("student_id, program_name, graduation_date, placement_date, placement_status, position_title, sponsorship_type, assigned_staff_name, employment_type, completion_status")
      .order("student_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

const COMPLETION_VIEWS = [
  { value: "all", label: "All participants" },
  { value: "graduated", label: "Graduates only" },
  { value: "not_graduated", label: "Not graduated only" }
] as const;

export default async function DashboardPage({ searchParams }: { searchParams: { completion?: string } }) {
  const supabase = createClient();
  const allRows = await fetchAllStudentRows(supabase);

  const completionView = COMPLETION_VIEWS.some((v) => v.value === searchParams.completion) ? searchParams.completion! : "all";
  const graduatedCount = allRows.filter((r) => r.completion_status !== "not_graduated").length;
  const notGraduatedCount = allRows.length - graduatedCount;
  const data = completionView === "all"
    ? allRows
    : allRows.filter((r) => (r.completion_status === "not_graduated" ? "not_graduated" : "graduated") === completionView);

  const { data: staffKpis } = await supabase.from("staff_kpi_overview").select("*").order("staff_name");

  const totalPlaced = data.filter((r) => r.placement_status === "placed").length;
  const totalFurtherSkilling = data.filter((r) => r.placement_status === "further_skilling").length;
  const totalDisinterested = data.filter((r) => r.placement_status === "declined_withdrawn").length;
  const totalUnplaced = data.length - totalPlaced - totalFurtherSkilling - totalDisinterested;
  const totalLabel = completionView === "graduated" ? "Graduates tracked" : completionView === "not_graduated" ? "Not graduated tracked" : "Participants tracked";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand">Dashboard</h1>
          <p className="text-sm text-accent">Placement performance across all participants. Visible to Admins and Officers alike.</p>
        </div>
        <div className="flex overflow-hidden rounded-md border border-border text-sm">
          {COMPLETION_VIEWS.map((v) => (
            <Link key={v.value} href={v.value === "all" ? "/dashboard" : `/dashboard?completion=${v.value}`}
              className={v.value === completionView ? "bg-brand px-3 py-1.5 font-medium text-white" : "px-3 py-1.5 text-ink/70 hover:bg-ink/5"}>
              {v.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label={totalLabel} value={data.length}
          sub={completionView === "all" ? `${graduatedCount} graduated · ${notGraduatedCount} not graduated` : undefined} />
        <StatCard label="Placed" value={totalPlaced} tone="success" />
        <StatCard label="Unplaced" value={totalUnplaced} tone="warning" />
        <StatCard label="Further Skilling" value={totalFurtherSkilling} tone="purple" />
        <StatCard label="Disinterested in Work" value={totalDisinterested} tone="danger" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Staff Accountability Overview</h2>
        <p className="text-xs text-accent">Current snapshot — placed against each staff member's actual caseload right now.</p>
        <div className="mt-3">
          <StaffAccountabilityTable staffKpis={(staffKpis ?? []) as any} />
        </div>
        <Link href="/my-caseload" className="mt-3 inline-block text-sm text-accent hover:underline">View your own caseload &rarr;</Link>
      </div>

      <DashboardClient rows={data as any} />
    </div>
  );
}

function StatCard({ label, value, tone, sub }: { label: string; value: number; tone?: "success" | "warning" | "purple" | "danger"; sub?: string }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "purple" ? "text-purple-700" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}
