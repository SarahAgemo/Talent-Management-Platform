/*"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import StatusBadge, { InclusionBadge } from "./StatusBadge";
import AllocationModal from "./AllocationModal";
import ClientPaginator from "./ClientPaginator";

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
  needsAllocation, allocated, staff
}: { needsAllocation: NeedsRow[]; allocated: AllocatedRow[]; staff: Staff[] }) {
  const [modalTarget, setModalTarget] = useState<{ studentId: string; studentName: string; needsInclusion: boolean; allocationId?: string | null } | null>(null);
  const [staffFilter, setStaffFilter] = useState("");
  const today = new Date();

  const filteredAllocated = staffFilter ? allocated.filter((r) => r.current_staff_name === staffFilter) : allocated;
  const staffNames = Array.from(new Set(allocated.map((r) => r.current_staff_name).filter(Boolean))) as string[];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold text-brand">Needs Allocation</h2>
        <p className="text-sm text-accent">Unallocated, or whose allocation deadline has passed.</p>
        <ClientPaginator items={needsAllocation}>
          {(pageItems) => (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3">Days out</th>
                    <th className="px-4 py-3">Inclusion</th><th className="px-4 py-3"></th>
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setModalTarget({ studentId: r.student_id, studentName: r.full_name, needsInclusion: r.needs_inclusion_support })}
                          className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark">
                          {r.allocation_deadline ? "Reallocate" : "Allocate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-ink/40">Everyone active is allocated. Nice.</td></tr>
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
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
            <option value="">All staff</option>
            {staffNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
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
                    <th className="px-4 py-3">Currently Assigned</th><th className="px-4 py-3"></th>
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
                        <td className="px-4 py-3">{r.needs_inclusion_support ? <span className="status-pill bg-purple-50 text-purple-700">Yes</span> : <span className="text-ink/30">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className={clsx("text-xs font-medium", overdue ? "text-danger" : "text-ink/60")}>
                            {overdue ? "Overdue — " : ""}{deadline.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink/70">
                          {r.first_staff_name ?? "—"}{wasReallocated && <span className="ml-1 text-xs text-accent">(reallocated)</span>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{r.current_staff_name ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setModalTarget({ studentId: r.student_id, studentName: r.student_name, needsInclusion: r.needs_inclusion_support, allocationId: r.allocation_id })}
                            className="text-xs font-medium text-accent hover:underline">
                            Reallocate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-ink/40">No active allocations yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ClientPaginator>
      </div>

      {modalTarget && (
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
*/

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
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark">
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
                        <td className="px-4 py-3">{r.needs_inclusion_support ? <span className="status-pill bg-purple-50 text-purple-700">Yes</span> : <span className="text-ink/30">—</span>}</td>
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
