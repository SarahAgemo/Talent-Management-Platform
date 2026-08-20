"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { STATUS_LABELS } from "./StatusBadge";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export default function StudentFilters({ programs, staff }: { programs: { id: string; name: string }[]; staff: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status");
  const activeProgram = searchParams.get("program");
  const activeStaff = searchParams.get("staff");
  const inclusionOnly = searchParams.get("inclusion") === "1";
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/students?${params.toString()}`);
  }

  function runSearch() { setParam("q", searchText.trim() || null); }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setParam("status", null)}
          className={clsx("status-pill border", !activeStatus ? "border-brand bg-brand text-white" : "border-border text-ink/60 hover:bg-ink/5")}>
          All statuses
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button key={status} onClick={() => setParam("status", status)}
            className={clsx("status-pill border", activeStatus === status ? "border-brand bg-brand text-white" : "border-border text-ink/60 hover:bg-ink/5")}>
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={activeProgram ?? ""} onChange={(e) => setParam("program", e.target.value || null)}
          className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>

        <select value={activeStaff ?? ""} onChange={(e) => setParam("staff", e.target.value || null)}
          className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="">Assigned to: anyone</option>
          <option value="__unassigned__">Unassigned only</option>
          {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <button onClick={() => setParam("inclusion", inclusionOnly ? null : "1")}
          className={clsx("status-pill border", inclusionOnly ? "border-purple-600 bg-purple-50 text-purple-700" : "border-border text-ink/60 hover:bg-ink/5")}>
          Needs inclusion support only
        </button>

        <div className="flex">
          <input type="text" placeholder="Search by name…" value={searchText}
            onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            className="w-64 rounded-l-md border border-border px-3 py-1.5 text-sm" />
          <button onClick={runSearch} className="rounded-r-md border border-l-0 border-border bg-ink/5 px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/10">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
