"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorPopup, { friendlyErrorMessage } from "./ErrorPopup";
import { isoFromDay, ugandaTodayDayNumber } from "@/lib/placedFilter";

type Staff = { id: string; name: string; is_inclusion_lead: boolean };
export type BulkStudent = { studentId: string; name: string; hasAllocation: boolean; needsInclusion: boolean };

// Allocate several students to one staff member in a single step. It all
// happens together or not at all (database function bulk_allocate). Any
// current allocation is closed as "reallocated", with the reason kept on
// the student's profile, exactly like a single reallocation.
export default function BulkAllocationModal({ students, staff, onClose, onDone }: {
  students: BulkStudent[]; staff: Staff[]; onClose: () => void; onDone: (message: string) => void;
}) {
  const [staffId, setStaffId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const reallocations = students.filter((s) => s.hasAllocation).length;
  const inclusion = students.filter((s) => s.needsInclusion).length;
  const today = isoFromDay(ugandaTodayDayNumber());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("bulk_allocate", {
      p_student_ids: students.map((s) => s.studentId),
      p_assigned_to: staffId,
      p_deadline: deadline,
      p_reason: reason.trim() || null
    });
    setSaving(false);
    if (rpcError) { setError(friendlyErrorMessage(rpcError.message)); return; }
    const staffName = staff.find((s) => s.id === staffId)?.name ?? "the selected staff member";
    const count = typeof data === "number" ? data : students.length;
    onDone(`${count} student${count === 1 ? "" : "s"} allocated to ${staffName}.`);
    router.refresh();
    onClose();
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, margin: 0 }} className="z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="bulk-allocate-title"
          className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-surface p-6 shadow-lg">
          <h2 id="bulk-allocate-title" className="font-display text-lg font-semibold text-brand">
            Allocate {students.length} student{students.length === 1 ? "" : "s"} to one person
          </h2>
          <p className="mt-1 text-sm text-ink/60">Each of them will show as a <span className="font-medium text-accent">New allocation</span> to that person until they mark it as seen.</p>

          <ul className="mt-3 max-h-36 overflow-y-auto rounded-md border border-border px-3 py-2 text-sm text-ink/80">
            {students.map((s) => (
              <li key={s.studentId} className="flex items-center justify-between gap-2 py-0.5">
                <span>{s.name}</span>
                {s.hasAllocation && <span className="text-xs text-ink/50">reallocation</span>}
              </li>
            ))}
          </ul>

          {inclusion > 0 && (
            <p className="mt-3 rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-700 dark:bg-purple-400/15 dark:text-purple-300">
              {inclusion} of these {inclusion === 1 ? "is" : "are"} flagged for disability/refugee inclusion support - consider an Inclusion Lead.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="bulk-staff" className="block text-sm font-medium text-ink/80">Assign to</label>
              <select id="bulk-staff" required value={staffId} onChange={(e) => setStaffId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="">Select staff…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_inclusion_lead ? " (Inclusion Lead)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="bulk-deadline" className="block text-sm font-medium text-ink/80">Deadline</label>
              <input id="bulk-deadline" type="date" required min={today} value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            {reallocations > 0 && (
              <div>
                <label htmlFor="bulk-reason" className="block text-sm font-medium text-ink/80">
                  Reason for reallocation ({reallocations} of {students.length} already have an allocation)
                </label>
                <textarea id="bulk-reason" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. moving the 10X group to one coordinator, workload rebalancing…"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-ink/40">Kept on each reallocated student&apos;s profile.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
                {saving ? "Allocating…" : `Allocate ${students.length}`}
              </button>
            </div>
          </form>
        </div>
      </div>
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </>
  );
}
