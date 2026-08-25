export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";
import StaffAccountabilityTable from "@/components/StaffAccountabilityTable";
import Link from "next/link";

// Supabase's API caps any single query at 1000 rows by default, and does
// this SILENTLY — no error, it just returns the first 1000. With more
// students than that, a single unpaginated select() undercounts every
// total and chart on this page. This loops in pages of 1000 until a
// short page signals the end, so the real total is always used.
async function fetchAllStudentRows(supabase: any) {
  const pageSize = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("student_overview")
      .select("program_name, graduation_date, placement_status, position_title, sponsorship_type")
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
  const totalUnplaced = data.length - totalPlaced;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Dashboard</h1>
        <p className="text-sm text-accent">Placement performance across all graduates.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total graduates tracked" value={data.length} />
        <StatCard label="Placed" value={totalPlaced} tone="success" />
        <StatCard label="Unplaced" value={totalUnplaced} tone="warning" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Staff Accountability Overview</h2>
        <p className="text-xs text-accent">Placed against each staff member's actual caseload</p>
        <div className="mt-3">
          <StaffAccountabilityTable staffKpis={(staffKpis ?? []) as any} />
        </div>
        <Link href="/my-caseload" className="mt-3 inline-block text-sm text-accent hover:underline">View your own caseload &rarr;</Link>
      </div>

      <DashboardClient rows={data as any} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-ink";
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
