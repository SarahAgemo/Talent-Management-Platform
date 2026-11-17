/*
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import AllocationBoard from "@/components/AllocationBoard";

export default async function AllocationsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user ? await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const isAdmin = me?.role === "super_admin" || me?.role === "placement_admin";

  const { data: staff } = await supabase.from("staff_users").select("id, name, is_inclusion_lead").order("name");

  const { data: needsRows } = await supabase
    .from("student_overview")
    .select("student_id, full_name, program_name, placement_status, days_since_graduation, disability_status, refugee_status, needs_inclusion_support, assigned_to, allocation_deadline")
    .neq("placement_status", "placed")
    .order("full_name");

  const needsAllocation = (needsRows ?? []).filter(
    (r) => !r.assigned_to || (r.allocation_deadline && r.allocation_deadline < today)
  );

  const { data: allocated } = await supabase
    .from("allocation_overview")
    .select("*")
    .order("deadline", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Allocations</h1>
        <p className="text-sm text-accent">
          {isAdmin
            ? "Allocate or reallocate students to staff directly from the table below, with a deadline set at the same time."
            : "A view of who's allocated to whom. Only Admins can allocate or reallocate students."}
        </p>
      </div>
      <AllocationBoard
        needsAllocation={needsAllocation as any}
        allocated={(allocated ?? []) as any}
        staff={(staff ?? []) as any}
        isAdmin={isAdmin}
      />
    </div>
  );
}
**/

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import AllocationBoard from "@/components/AllocationBoard";

export default async function AllocationsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user ? await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const isAdmin = me?.role === "super_admin" || me?.role === "placement_admin";

  const { data: staff } = await supabase.from("staff_users").select("id, name, is_inclusion_lead").order("name");

  // Read in stable pages — a single read stops at 1,000 rows, which would
  // silently hide students from the Needs Allocation list.
  const needsRows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("student_overview")
      .select("student_id, full_name, program_name, placement_status, days_since_graduation, disability_status, refugee_status, needs_inclusion_support, assigned_to, allocation_deadline, completion_status, ten_x_id, sponsorship_type")
      .neq("placement_status", "placed")
      .order("full_name")
      .order("student_id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    needsRows.push(...data);
    if (data.length < 1000) break;
  }

  const needsAllocation = needsRows.filter(
    (r) => !r.assigned_to || (r.allocation_deadline && r.allocation_deadline < today)
  );

  const allocated: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("allocation_overview")
      .select("*")
      .order("deadline", { ascending: true })
      .order("allocation_id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    allocated.push(...data);
    if (data.length < 1000) break;
  }

  // 10X file and sponsor for every student, so the Allocated list can be filtered the same way.
  const infoById = new Map<string, { ten_x_id: string | null; sponsorship_type: string | null }>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("student_overview")
      .select("student_id, ten_x_id, sponsorship_type")
      .order("student_id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const r of data as any[]) infoById.set(r.student_id, { ten_x_id: r.ten_x_id, sponsorship_type: r.sponsorship_type });
    if (data.length < 1000) break;
  }

  // Allocations not yet marked as seen by their coordinator ("New allocation").
  // (If the database update hasn't been run yet this read fails and nothing shows as new.)
  const unseenIds = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("allocations")
      .select("id")
      .eq("allocation_status", "active")
      .is("seen_at", null)
      .order("id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const a of data as any[]) unseenIds.add(a.id);
    if (data.length < 1000) break;
  }

  const allocatedRows = allocated.map((r: any) => ({
    ...r,
    ten_x_id: infoById.get(r.student_id)?.ten_x_id ?? null,
    sponsorship_type: infoById.get(r.student_id)?.sponsorship_type ?? null,
    is_new: unseenIds.has(r.allocation_id)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Allocations</h1>
        <p className="text-sm text-accent">
          {isAdmin
            ? "Allocate or reallocate students to staff from the tables below, one at a time or several at once: tick the students, then choose who to allocate them to."
            : "A view of who's allocated to whom. Only Admins can allocate or reallocate students."}
        </p>
      </div>
      <AllocationBoard
        needsAllocation={needsAllocation as any}
        allocated={allocatedRows as any}
        staff={(staff ?? []) as any}
        isAdmin={isAdmin}
      />
    </div>
  );
}
