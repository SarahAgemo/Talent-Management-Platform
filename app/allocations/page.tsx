export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import AllocationBoard from "@/components/AllocationBoard";

export default async function AllocationsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: staff } = await supabase.from("staff_users").select("id, name, is_inclusion_lead").order("name");

  // Needs allocation: unallocated, active, not-yet-placed students.
  const { data: needsRows } = await supabase
    .from("student_overview")
    .select("student_id, full_name, program_name, placement_status, days_since_graduation, disability_status, refugee_status, needs_inclusion_support, assigned_to, allocation_deadline")
    .neq("placement_status", "placed")
    .order("full_name");

  const needsAllocation = (needsRows ?? []).filter(
    (r) => !r.assigned_to || (r.allocation_deadline && r.allocation_deadline < today)
  );

  // Everyone currently allocated, with first-vs-current assignee — one row
  // per active allocation, straight from the view.
  const { data: allocated } = await supabase
    .from("allocation_overview")
    .select("*")
    .order("deadline", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Allocations</h1>
        <p className="text-sm text-accent">
          Allocate or reallocate students to staff directly from the table below, with a deadline set at the same time.
        </p>
      </div>
      <AllocationBoard needsAllocation={needsAllocation as any} allocated={(allocated ?? []) as any} staff={(staff ?? []) as any} />
    </div>
  );
}
