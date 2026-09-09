export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import StudentFilters from "@/components/StudentFilters";
import StudentTable from "@/components/StudentTable";
import Pagination from "@/components/Pagination";
import ExportStudentsButton from "@/components/ExportStudentsButton";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 30, 50];

export default async function StudentsPage({
  searchParams
}: {
  searchParams: { status?: string; program?: string; q?: string; inclusion?: string; page?: string; staff?: string; pageSize?: string };
}) {
  const supabase = createClient();
  const { data: programs } = await supabase.from("programs").select("id, name").order("name");
  const { data: staffList } = await supabase.from("staff_users").select("id, name").order("name");

  const requestedSize = parseInt(searchParams.pageSize ?? "", 10);
  const pageSize = ALLOWED_PAGE_SIZES.includes(requestedSize) ? requestedSize : DEFAULT_PAGE_SIZE;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("student_overview")
    .select(
      "student_id, full_name, program_name, cohort_name, graduation_date, placement_status, company_name, placement_date, days_since_graduation, disability_status, refugee_status, assigned_staff_name",
      { count: "exact" }
    )
    .order("graduation_date", { ascending: false })
    .range(from, to);

  if (searchParams.status) query = query.eq("placement_status", searchParams.status);
  if (searchParams.program) query = query.eq("program_name", searchParams.program);
  if (searchParams.q) query = query.ilike("full_name", `%${searchParams.q}%`);
  if (searchParams.inclusion === "1") query = query.eq("needs_inclusion_support", true);
  if (searchParams.staff === "__unassigned__") query = query.is("assigned_staff_name", null);
  else if (searchParams.staff === "__assigned__") query = query.not("assigned_staff_name", "is", null);
  else if (searchParams.staff) query = query.eq("assigned_staff_name", searchParams.staff);

  const { data: rows, error, count } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand">Student Directory</h1>
          <p className="text-sm text-accent">{count ?? 0} student{count === 1 ? "" : "s"} matching current filters</p>
        </div>
        <ExportStudentsButton />
      </div>
      <StudentFilters programs={programs ?? []} staff={staffList ?? []} />
      {error && (
        <p className="text-sm text-danger">
          Couldn&apos;t load students: {error.message}. Check that all migrations have been run.
        </p>
      )}
      <StudentTable rows={rows ?? []} />
      <Pagination page={page} pageSize={pageSize} totalCount={count ?? 0} />
    </div>
  );
}