
/** 
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import StatusBadge, { InclusionBadge } from "./StatusBadge";
import AllocationModal from "./AllocationModal";
import ClientPaginator from "./ClientPaginator";
import ExportButton from "./ExportButton";

type Staff = { id: string; name: string; is_inclusion_lead: boolean };

type NeedsRow = {
  student_id: string; full_name: string; program_name: string | null; placement_status: string | null;
  days_since_graduation: number | null; disability_status: string | null; refugee_status: string | null;
  needs_inclusion_support: boolean; allocation_deadline: string | null;
};

type AllocatedRow = {
  allocation_id: string; student_id: string; student_name: string; program_name: string | null;
  placement_status: string | null; needs_inclusion_support: boolean; deadline: string;
  current_staff_name: string | null; first_staff_name: string | null;
};

export default function AllocationBoard({
  needsAllocation, allocated, staff, isAdmin
}: { needsAllocation: NeedsRow[]; allocated: AllocatedRow[]; staff: Staff[]; isAdmin: boolean }) {
  const [modalTarget, setModalTarget] = useState<{ studentId: string; studentName: string; needsInclusion: boolean; allocationId?: string | null } | null>(null);
  const [staffFilter, setStaffFilter] = useState("");
  const [needsProgramFilter, setNeedsProgramFilter] = useState("");
  const [needsNameFilter, setNeedsNameFilter] = useState("");
  const [allocatedProgramFilter, setAllocatedProgramFilter] = useState("");
  const [allocatedNameFilter, setAllocatedNameFilter] = useState("");
  const today = new Date();

  const needsPrograms = Array.from(new Set(needsAllocation.map((r) => r.program_name).filter(Boolean))) as string[];
  const allocatedPrograms = Array.from(new Set(allocated.map((r) => r.program_name).filter(Boolean))) as string[];
  const staffNames = Array.from(new Set(allocated.map((r) => r.current_staff_name).filter(Boolean))) as string[];

  const filteredNeeds = useMemo(() => needsAllocation.filter((r) => {
    if (needsProgramFilter && r.program_name !== needsProgramFilter) return false;
    if (needsNameFilter && !r.full_name.toLowerCase().includes(needsNameFilter.toLowerCase())) return false;
    return true;
  }), [needsAllocation, needsProgramFilter, needsNameFilter]);

  const filteredAllocated = useMemo(() => allocated.filter((r) => {
    if (staffFilter && r.current_staff_name !== staffFilter) return false;
    if (allocatedProgramFilter && r.program_name !== allocatedProgramFilter) return false;
    if (allocatedNameFilter && !r.student_name.toLowerCase().includes(allocatedNameFilter.toLowerCase())) return false;
    return true;
  }), [allocated, staffFilter, allocatedProgramFilter, allocatedNameFilter]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Needs Allocation</h2>
            <p className="text-sm text-accent">Unallocated, or whose allocation deadline has passed.</p>
          </div>
          <ExportButton data={filteredNeeds as any} filename="needs_allocation" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <select value={needsProgramFilter} onChange={(e) => setNeedsProgramFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
            <option value="">All programs</option>
            {needsPrograms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="text" placeholder="Search by name…" value={needsNameFilter} onChange={(e) => setNeedsNameFilter(e.target.value)}
            className="rounded-md border border-border px-3 py-1.5 text-sm" />
        </div>

        <ClientPaginator items={filteredNeeds}>
          {(pageItems) => (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3">Days out</th>
                    <th className="px-4 py-3">Inclusion</th>{isAdmin && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((r) => (
                    <tr key={r.student_id} className="hover:bg-ink/[0.02]">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/students/${r.student_id}`} className="hover:text-accent hover:underline">{r.full_name}</Link>
                      </td>
                      <td className="px-4 py-3 text-ink/70">{r.program_name ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.placement_status ?? "awaiting_placement"} /></td>
                      <td className="px-4 py-3 text-ink/70">{r.days_since_graduation ?? "—"}d</td>
                      <td className="px-4 py-3"><InclusionBadge disability={r.disability_status} refugee={r.refugee_status} /></td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setModalTarget({ studentId: r.student_id, studentName: r.full_name, needsInclusion: r.needs_inclusion_support })}
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">
                            {r.allocation_deadline ? "Reallocate" : "Allocate"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-sm text-ink/40">Nothing matches these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ClientPaginator>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Allocated Students</h2>
            <p className="text-sm text-accent">Every student with an active allocation, in one place.</p>
          </div>
          <ExportButton data={filteredAllocated as any} filename="allocated_students" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <select value={allocatedProgramFilter} onChange={(e) => setAllocatedProgramFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
            <option value="">All programs</option>
            {allocatedPrograms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
            <option value="">All staff</option>
            {staffNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="text" placeholder="Search by name…" value={allocatedNameFilter} onChange={(e) => setAllocatedNameFilter(e.target.value)}
            className="rounded-md border border-border px-3 py-1.5 text-sm" />
        </div>

        <ClientPaginator items={filteredAllocated}>
          {(pageItems) => (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3">Inclusion</th>
                    <th className="px-4 py-3">Due Date</th><th className="px-4 py-3">First Allocated To</th>
                    <th className="px-4 py-3">Currently Assigned</th>{isAdmin && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((r) => {
                    const deadline = new Date(r.deadline);
                    const overdue = deadline < today && r.placement_status !== "placed";
                    const wasReallocated = r.first_staff_name && r.first_staff_name !== r.current_staff_name;
                    return (
                      <tr key={r.allocation_id} className="hover:bg-ink/[0.02]">
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/students/${r.student_id}`} className="hover:text-accent hover:underline">{r.student_name}</Link>
                        </td>
                        <td className="px-4 py-3 text-ink/70">{r.program_name ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.placement_status ?? "awaiting_placement"} /></td>
                        <td className="px-4 py-3">{r.needs_inclusion_support ? <span className="status-pill bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300">Yes</span> : <span className="text-ink/30">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className={clsx("text-xs font-medium", overdue ? "text-danger" : "text-ink/60")}>
                            {overdue ? "Overdue — " : ""}{deadline.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink/70">
                          {r.first_staff_name ?? "—"}{wasReallocated && <span className="ml-1 text-xs text-accent">(reallocated)</span>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{r.current_staff_name ?? "—"}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setModalTarget({ studentId: r.student_id, studentName: r.student_name, needsInclusion: r.needs_inclusion_support, allocationId: r.allocation_id })}
                              className="text-xs font-medium text-accent hover:underline">
                              Reallocate
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-6 text-center text-sm text-ink/40">Nothing matches these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ClientPaginator>
      </div>

      {modalTarget && isAdmin && (
        <AllocationModal
          studentId={modalTarget.studentId}
          studentName={modalTarget.studentName}
          needsInclusion={modalTarget.needsInclusion}
          staff={staff}
          existingAllocationId={modalTarget.allocationId ?? null}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
**/

"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import StatusBadge, { InclusionBadge } from "./StatusBadge";
import AllocationModal from "./AllocationModal";
import BulkAllocationModal, { type BulkStudent } from "./BulkAllocationModal";
import ClientPaginator from "./ClientPaginator";
import ExportButton from "./ExportButton";
import { NewAllocationBadge } from "./NewAllocationNotice";

type Staff = { id: string; name: string; is_inclusion_lead: boolean };

type NeedsRow = {
  student_id: string; full_name: string; program_name: string | null; placement_status: string | null;
  days_since_graduation: number | null; disability_status: string | null; refugee_status: string | null;
  needs_inclusion_support: boolean; allocation_deadline: string | null; completion_status?: string | null;
  ten_x_id?: string | null; sponsorship_type?: string | null; assigned_to?: string | null;
};

type AllocatedRow = {
  allocation_id: string; student_id: string; student_name: string; program_name: string | null;
  placement_status: string | null; needs_inclusion_support: boolean; deadline: string;
  current_staff_name: string | null; first_staff_name: string | null;
  ten_x_id?: string | null; sponsorship_type?: string | null; is_new?: boolean;
};

const SELECT = "rounded-md border border-border px-3 py-1.5 text-sm";

function matchesTenx(filter: string, tenxId: string | null | undefined) {
  if (filter === "in") return !!tenxId;
  if (filter === "out") return !tenxId;
  return true;
}

export default function AllocationBoard({
  needsAllocation, allocated, staff, isAdmin
}: { needsAllocation: NeedsRow[]; allocated: AllocatedRow[]; staff: Staff[]; isAdmin: boolean }) {
  const [modalTarget, setModalTarget] = useState<{ studentId: string; studentName: string; needsInclusion: boolean; allocationId?: string | null } | null>(null);
  const [bulkStudents, setBulkStudents] = useState<BulkStudent[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState("");
  const [needsProgramFilter, setNeedsProgramFilter] = useState("");
  const [needsNameFilter, setNeedsNameFilter] = useState("");
  // Placement work is for graduates, so the list opens on graduates only —
  // switch the dropdown to see participants who haven't graduated.
  const [needsCompletionFilter, setNeedsCompletionFilter] = useState<"graduated" | "not_graduated" | "">("graduated");
  const [needsTenxFilter, setNeedsTenxFilter] = useState("");
  const [needsSponsorFilter, setNeedsSponsorFilter] = useState("");
  const [allocatedProgramFilter, setAllocatedProgramFilter] = useState("");
  const [allocatedNameFilter, setAllocatedNameFilter] = useState("");
  const [allocatedTenxFilter, setAllocatedTenxFilter] = useState("");
  const [allocatedSponsorFilter, setAllocatedSponsorFilter] = useState("");
  const [allocatedNewOnly, setAllocatedNewOnly] = useState(false);
  const [needsSelected, setNeedsSelected] = useState<Set<string>>(new Set());
  const [allocatedSelected, setAllocatedSelected] = useState<Set<string>>(new Set());
  const today = new Date();

  const needsPrograms = Array.from(new Set(needsAllocation.map((r) => r.program_name).filter(Boolean))) as string[];
  const allocatedPrograms = Array.from(new Set(allocated.map((r) => r.program_name).filter(Boolean))) as string[];
  const staffNames = Array.from(new Set(allocated.map((r) => r.current_staff_name).filter(Boolean))) as string[];
  const needsSponsors = (Array.from(new Set(needsAllocation.map((r) => r.sponsorship_type).filter(Boolean))) as string[]).sort();
  const allocatedSponsors = (Array.from(new Set(allocated.map((r) => r.sponsorship_type).filter(Boolean))) as string[]).sort();

  const filteredNeeds = useMemo(() => needsAllocation.filter((r) => {
    if (needsProgramFilter && r.program_name !== needsProgramFilter) return false;
    if (needsNameFilter && !r.full_name.toLowerCase().includes(needsNameFilter.toLowerCase())) return false;
    if (needsCompletionFilter && (r.completion_status === "not_graduated" ? "not_graduated" : "graduated") !== needsCompletionFilter) return false;
    if (!matchesTenx(needsTenxFilter, r.ten_x_id)) return false;
    if (needsSponsorFilter && r.sponsorship_type !== needsSponsorFilter) return false;
    return true;
  }), [needsAllocation, needsProgramFilter, needsNameFilter, needsCompletionFilter, needsTenxFilter, needsSponsorFilter]);

  const filteredAllocated = useMemo(() => allocated.filter((r) => {
    if (staffFilter && r.current_staff_name !== staffFilter) return false;
    if (allocatedProgramFilter && r.program_name !== allocatedProgramFilter) return false;
    if (allocatedNameFilter && !r.student_name.toLowerCase().includes(allocatedNameFilter.toLowerCase())) return false;
    if (!matchesTenx(allocatedTenxFilter, r.ten_x_id)) return false;
    if (allocatedSponsorFilter && r.sponsorship_type !== allocatedSponsorFilter) return false;
    if (allocatedNewOnly && !r.is_new) return false;
    return true;
  }), [allocated, staffFilter, allocatedProgramFilter, allocatedNameFilter, allocatedTenxFilter, allocatedSponsorFilter, allocatedNewOnly]);

  // Only ticked students that are still shown by the current filters count,
  // and each student once (old data can hold two rows for one student).
  const needsChosen = uniqueByStudent(filteredNeeds.filter((r) => needsSelected.has(r.student_id)));
  const allocatedChosen = uniqueByStudent(filteredAllocated.filter((r) => allocatedSelected.has(r.student_id)));
  const needsTotal = new Set(filteredNeeds.map((r) => r.student_id)).size;
  const allocatedTotal = new Set(filteredAllocated.map((r) => r.student_id)).size;

  function toggle(set: Set<string>, update: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    update(next);
  }

  function openBulkForNeeds() {
    setNotice(null);
    setBulkStudents(needsChosen.map((r) => ({
      studentId: r.student_id, name: r.full_name, hasAllocation: !!(r.assigned_to || r.allocation_deadline), needsInclusion: r.needs_inclusion_support
    })));
  }

  function openBulkForAllocated() {
    setNotice(null);
    setBulkStudents(allocatedChosen.map((r) => ({
      studentId: r.student_id, name: r.student_name, hasAllocation: true, needsInclusion: r.needs_inclusion_support
    })));
  }

  return (
    <div className="space-y-8">
      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs font-medium hover:underline">Dismiss</button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Needs Allocation</h2>
            <p className="text-sm text-accent">Unallocated, or whose allocation deadline has passed.</p>
          </div>
          <ExportButton data={filteredNeeds as any} filename="needs_allocation" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <select value={needsProgramFilter} onChange={(e) => setNeedsProgramFilter(e.target.value)} className={SELECT}>
            <option value="">All programs</option>
            {needsPrograms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={needsCompletionFilter} onChange={(e) => setNeedsCompletionFilter(e.target.value as "graduated" | "not_graduated" | "")} className={SELECT}>
            <option value="graduated">Graduates only</option>
            <option value="not_graduated">Not graduated only</option>
            <option value="">Graduated &amp; not graduated</option>
          </select>
          <select aria-label="10X file" value={needsTenxFilter} onChange={(e) => setNeedsTenxFilter(e.target.value)} className={SELECT}>
            <option value="">In &amp; not in the 10X file</option>
            <option value="in">In the 10X file</option>
            <option value="out">Not in the 10X file</option>
          </select>
          <select aria-label="Sponsor" value={needsSponsorFilter} onChange={(e) => setNeedsSponsorFilter(e.target.value)} className={SELECT}>
            <option value="">All sponsors</option>
            {needsSponsors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Search by name…" value={needsNameFilter} onChange={(e) => setNeedsNameFilter(e.target.value)} className={SELECT} />
        </div>

        {isAdmin && (
          <SelectionBar count={needsChosen.length} total={needsTotal}
            onSelectAll={() => setNeedsSelected(new Set(filteredNeeds.map((r) => r.student_id)))}
            onClear={() => setNeedsSelected(new Set())} onAllocate={openBulkForNeeds} />
        )}

        <ClientPaginator items={filteredNeeds}>
          {(pageItems) => (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                  <tr>
                    {isAdmin && (
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" aria-label="Select every student on this page"
                          checked={pageItems.length > 0 && pageItems.every((r) => needsSelected.has(r.student_id))}
                          onChange={(e) => {
                            const next = new Set(needsSelected);
                            for (const r of pageItems) { if (e.target.checked) next.add(r.student_id); else next.delete(r.student_id); }
                            setNeedsSelected(next);
                          }} />
                      </th>
                    )}
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3">Days out</th>
                    <th className="px-4 py-3">Inclusion</th>{isAdmin && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((r) => (
                    <tr key={r.student_id} className={clsx("hover:bg-ink/[0.02]", needsSelected.has(r.student_id) && "bg-brand/5")}>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <input type="checkbox" aria-label={`Select ${r.full_name}`} checked={needsSelected.has(r.student_id)}
                            onChange={() => toggle(needsSelected, setNeedsSelected, r.student_id)} />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/students/${r.student_id}`} className="hover:text-accent hover:underline">{r.full_name}</Link>
                        {r.ten_x_id && <span className="ml-2 status-pill bg-ink/5 text-ink/60">10X</span>}
                      </td>
                      <td className="px-4 py-3 text-ink/70">{r.program_name ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.placement_status ?? "awaiting_placement"} /></td>
                      <td className="px-4 py-3 text-ink/70">{r.days_since_graduation != null ? `${r.days_since_graduation}d` : "—"}</td>
                      <td className="px-4 py-3"><InclusionBadge disability={r.disability_status} refugee={r.refugee_status} /></td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setModalTarget({ studentId: r.student_id, studentName: r.full_name, needsInclusion: r.needs_inclusion_support })}
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">
                            {r.allocation_deadline ? "Reallocate" : "Allocate"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={isAdmin ? 7 : 5} className="px-4 py-6 text-center text-sm text-ink/40">Nothing matches these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ClientPaginator>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">Allocated Students</h2>
            <p className="text-sm text-accent">Every student with an active allocation, in one place.</p>
          </div>
          <ExportButton data={filteredAllocated as any} filename="allocated_students" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <select value={allocatedProgramFilter} onChange={(e) => setAllocatedProgramFilter(e.target.value)} className={SELECT}>
            <option value="">All programs</option>
            {allocatedPrograms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className={SELECT}>
            <option value="">All staff</option>
            {staffNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select aria-label="10X file" value={allocatedTenxFilter} onChange={(e) => setAllocatedTenxFilter(e.target.value)} className={SELECT}>
            <option value="">In &amp; not in the 10X file</option>
            <option value="in">In the 10X file</option>
            <option value="out">Not in the 10X file</option>
          </select>
          <select aria-label="Sponsor" value={allocatedSponsorFilter} onChange={(e) => setAllocatedSponsorFilter(e.target.value)} className={SELECT}>
            <option value="">All sponsors</option>
            {allocatedSponsors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Search by name…" value={allocatedNameFilter} onChange={(e) => setAllocatedNameFilter(e.target.value)} className={SELECT} />
          <button type="button" onClick={() => setAllocatedNewOnly(!allocatedNewOnly)} aria-pressed={allocatedNewOnly}
            className={clsx("status-pill border", allocatedNewOnly ? "border-accent bg-accent/15 text-accent" : "border-border text-ink/60 hover:bg-ink/5")}>
            New allocations only ({allocated.filter((r) => r.is_new).length})
          </button>
        </div>

        {isAdmin && (
          <SelectionBar count={allocatedChosen.length} total={allocatedTotal} verb="Reallocate"
            onSelectAll={() => setAllocatedSelected(new Set(filteredAllocated.map((r) => r.student_id)))}
            onClear={() => setAllocatedSelected(new Set())} onAllocate={openBulkForAllocated} />
        )}

        <ClientPaginator items={filteredAllocated}>
          {(pageItems) => (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                  <tr>
                    {isAdmin && (
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" aria-label="Select every student on this page"
                          checked={pageItems.length > 0 && pageItems.every((r) => allocatedSelected.has(r.student_id))}
                          onChange={(e) => {
                            const next = new Set(allocatedSelected);
                            for (const r of pageItems) { if (e.target.checked) next.add(r.student_id); else next.delete(r.student_id); }
                            setAllocatedSelected(next);
                          }} />
                      </th>
                    )}
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3">Inclusion</th>
                    <th className="px-4 py-3">Due Date</th><th className="px-4 py-3">First Allocated To</th>
                    <th className="px-4 py-3">Currently Assigned</th>{isAdmin && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((r) => {
                    const deadline = new Date(r.deadline);
                    const overdue = deadline < today && r.placement_status !== "placed";
                    const wasReallocated = r.first_staff_name && r.first_staff_name !== r.current_staff_name;
                    return (
                      <tr key={r.allocation_id} className={clsx("hover:bg-ink/[0.02]", allocatedSelected.has(r.student_id) && "bg-brand/5")}>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <input type="checkbox" aria-label={`Select ${r.student_name}`} checked={allocatedSelected.has(r.student_id)}
                              onChange={() => toggle(allocatedSelected, setAllocatedSelected, r.student_id)} />
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/students/${r.student_id}`} className="hover:text-accent hover:underline">{r.student_name}</Link>
                          {r.ten_x_id && <span className="ml-2 status-pill bg-ink/5 text-ink/60">10X</span>}
                          {r.is_new && <div className="mt-1"><NewAllocationBadge /></div>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{r.program_name ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.placement_status ?? "awaiting_placement"} /></td>
                        <td className="px-4 py-3">{r.needs_inclusion_support ? <span className="status-pill bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300">Yes</span> : <span className="text-ink/30">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className={clsx("text-xs font-medium", overdue ? "text-danger" : "text-ink/60")}>
                            {overdue ? "Overdue — " : ""}{deadline.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink/70">
                          {r.first_staff_name ?? "—"}{wasReallocated && <span className="ml-1 text-xs text-accent">(reallocated)</span>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{r.current_staff_name ?? "—"}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setModalTarget({ studentId: r.student_id, studentName: r.student_name, needsInclusion: r.needs_inclusion_support, allocationId: r.allocation_id })}
                              className="text-xs font-medium text-accent hover:underline">
                              Reallocate
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={isAdmin ? 9 : 7} className="px-4 py-6 text-center text-sm text-ink/40">Nothing matches these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ClientPaginator>
      </div>

      {modalTarget && isAdmin && (
        <AllocationModal
          studentId={modalTarget.studentId}
          studentName={modalTarget.studentName}
          needsInclusion={modalTarget.needsInclusion}
          staff={staff}
          existingAllocationId={modalTarget.allocationId ?? null}
          onClose={() => setModalTarget(null)}
        />
      )}

      {bulkStudents && isAdmin && (
        <BulkAllocationModal
          students={bulkStudents}
          staff={staff}
          onClose={() => setBulkStudents(null)}
          onDone={(message) => { setNotice(message); setNeedsSelected(new Set()); setAllocatedSelected(new Set()); }}
        />
      )}
    </div>
  );
}

function uniqueByStudent<T extends { student_id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.student_id)) return false;
    seen.add(r.student_id);
    return true;
  });
}

// "N selected · Select all · Clear · Allocate selected" bar above a table.
function SelectionBar({ count, total, onSelectAll, onClear, onAllocate, verb = "Allocate" }: {
  count: number; total: number; onSelectAll: () => void; onClear: () => void; onAllocate: () => void; verb?: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-brand/5 px-3 py-2 text-sm">
      <span className="font-medium text-brand">{count} selected</span>
      {count < total && (
        <button type="button" onClick={onSelectAll} className="text-accent hover:underline">Select all {total} matching</button>
      )}
      {count > 0 && <button type="button" onClick={onClear} className="text-ink/60 hover:underline">Clear</button>}
      <span className="text-xs text-ink/50">{count === 0 ? "Tick students, or use the filters and Select all, to allocate several to one person." : ""}</span>
      <button type="button" onClick={onAllocate} disabled={count === 0}
        className="ml-auto rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
        {verb} {count > 0 ? count : ""} selected to one person
      </button>
    </div>
  );
}
