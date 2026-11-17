"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shortDate, ugandaTodayDayNumber } from "@/lib/placedFilter";

// "New allocation" marker. A student newly allocated to a placement
// coordinator stays marked until that coordinator clicks "Mark as seen",
// so students who have been in the system for a while get proper attention
// rather than being treated like fresh graduates.

// "15 Nov 2026" (the date in Uganda)
export function formatAllocatedDate(value: string) {
  return shortDate(ugandaTodayDayNumber(new Date(value)));
}

export function NewAllocationBadge({ assignedAt }: { assignedAt?: string | null }) {
  return (
    <span className="status-pill bg-accent/15 text-accent" title={assignedAt ? `Newly allocated on ${formatAllocatedDate(assignedAt)} - not yet marked as seen` : "Newly allocated - not yet marked as seen"}>
      New allocation
    </span>
  );
}

export function MarkSeenButton({ allocationId, className }: { allocationId: string; className?: string }) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function markSeen() {
    setSaving(true);
    setFailed(false);
    const { data, error } = await supabase.rpc("mark_allocation_seen", { p_allocation_id: allocationId });
    setSaving(false);
    if (error || data !== true) { setFailed(true); return; }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={markSeen} disabled={saving}
        className={className ?? "rounded-md border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"}>
        {saving ? "Saving…" : "Mark as seen"}
      </button>
      {failed && <span className="text-xs text-danger">Couldn&apos;t save - only the assigned coordinator can do this.</span>}
    </span>
  );
}

export default function NewAllocationNotice({ allocationId, assignedAt, isMine }: { allocationId: string; assignedAt: string; isMine: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 shrink-0 text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <div className="text-sm">
          <p className="font-semibold text-accent">New allocation</p>
          <p className="text-ink/70">
            {isMine
              ? `Allocated to you on ${formatAllocatedDate(assignedAt)}. This student has been in the system before, so read their status, comments and history before reaching out.`
              : `Allocated on ${formatAllocatedDate(assignedAt)} and not yet marked as seen by their placement coordinator.`}
          </p>
        </div>
      </div>
      {isMine && <MarkSeenButton allocationId={allocationId} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60" />}
    </div>
  );
}
