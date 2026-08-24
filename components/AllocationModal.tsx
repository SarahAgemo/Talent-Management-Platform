/*"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Staff = { id: string; name: string; is_inclusion_lead: boolean };

export default function AllocationModal({
  studentId, studentName, needsInclusion, staff, existingAllocationId, onClose
}: {
  studentId: string; studentName: string; needsInclusion: boolean; staff: Staff[];
  existingAllocationId?: string | null; onClose: () => void;
}) {
  const [staffId, setStaffId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const isReallocation = !!existingAllocationId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (isReallocation) {
      // Mark the old allocation as history, then insert a fresh active row —
      // preserves the full trail instead of overwriting it.
      const { error: closeError } = await supabase
        .from("allocations")
        .update({ allocation_status: "reallocated" })
        .eq("id", existingAllocationId);
      if (closeError) { setSaving(false); setError(closeError.message); return; }

      const { error: insertError } = await supabase.from("allocations").insert({
        student_id: studentId, assigned_to: staffId, assigned_by: user?.id,
        deadline, allocation_status: "active", reason: reason.trim() || null
      });
      setSaving(false);
      if (insertError) { setError(insertError.message); return; }
    } else {
      const { error: insertError } = await supabase.from("allocations").insert({
        student_id: studentId, assigned_to: staffId, assigned_by: user?.id,
        deadline, allocation_status: "active"
      });
      setSaving(false);
      if (insertError) { setError(insertError.message); return; }
    }

    router.refresh();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0 }} className="z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="font-display text-lg font-semibold text-brand">
          {isReallocation ? "Reallocate" : "Allocate"} {studentName}
        </h2>

        {needsInclusion && (
          <p className="mt-2 rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-700">
            This student is flagged for disability/refugee inclusion support — consider
            assigning an Inclusion Lead below.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink/80">Assign to</label>
            <select required value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
              <option value="">Select staff…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.is_inclusion_lead ? " (Inclusion Lead)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">Deadline</label>
            <input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          {isReallocation && (
            <div>
              <label className="block text-sm font-medium text-ink/80">Reason for reallocation</label>
              <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. previous staff member on leave, workload rebalancing…"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-ink/40">Kept on the student's profile so the team knows why this changed.</p>
            </div>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}*/

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorPopup, { friendlyErrorMessage } from "./ErrorPopup";

type Staff = { id: string; name: string; is_inclusion_lead: boolean };

export default function AllocationModal({
  studentId, studentName, needsInclusion, staff, existingAllocationId, onClose
}: {
  studentId: string; studentName: string; needsInclusion: boolean; staff: Staff[];
  existingAllocationId?: string | null; onClose: () => void;
}) {
  const [staffId, setStaffId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const isReallocation = !!existingAllocationId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (isReallocation) {
      const { error: closeError } = await supabase
        .from("allocations").update({ allocation_status: "reallocated" }).eq("id", existingAllocationId);
      if (closeError) { setSaving(false); setError(friendlyErrorMessage(closeError.message)); return; }

      const { error: insertError } = await supabase.from("allocations").insert({
        student_id: studentId, assigned_to: staffId, assigned_by: user?.id,
        deadline, allocation_status: "active", reason: reason.trim() || null
      });
      setSaving(false);
      if (insertError) { setError(friendlyErrorMessage(insertError.message)); return; }
    } else {
      const { error: insertError } = await supabase.from("allocations").insert({
        student_id: studentId, assigned_to: staffId, assigned_by: user?.id, deadline, allocation_status: "active"
      });
      setSaving(false);
      if (insertError) { setError(friendlyErrorMessage(insertError.message)); return; }
    }

    router.refresh();
    onClose();
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0 }} className="z-50 flex items-center justify-center bg-ink/40 p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
          <h2 className="font-display text-lg font-semibold text-brand">
            {isReallocation ? "Reallocate" : "Allocate"} {studentName}
          </h2>

          {needsInclusion && (
            <p className="mt-2 rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-700">
              This student is flagged for disability/refugee inclusion support — consider assigning an Inclusion Lead below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-ink/80">Assign to</label>
              <select required value={staffId} onChange={(e) => setStaffId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="">Select staff…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.is_inclusion_lead ? " (Inclusion Lead)" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80">Deadline</label>
              <input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            {isReallocation && (
              <div>
                <label className="block text-sm font-medium text-ink/80">Reason for reallocation</label>
                <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. previous staff member on leave, workload rebalancing…"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-ink/40">Kept on the student's profile so the team knows why this changed.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </>
  );
}

