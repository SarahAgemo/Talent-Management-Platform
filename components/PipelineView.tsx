"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import StatusBadge from "./StatusBadge";
import { RagBadge, RiskBadge, ReadinessBar } from "./RagBadge";
import ClientPaginator from "./ClientPaginator";
import ExportButton from "./ExportButton";
import { MarkSeenButton, NewAllocationBadge } from "./NewAllocationNotice";

type Card = {
  student_id: string; full_name: string; track: string | null; program_name: string | null;
  placement_status: string | null; days_in_stage: number | null; risk_flag: string | null;
  applications_logged: number; overall_readiness: string | null;
  green_count: number; amber_count: number; red_count: number; last_activity_date: string | null;
};

const STAGE_LABELS: Record<string, string> = {
  awaiting_placement: "Ready", in_preparation: "Ready", applying: "Applying",
  interviewing: "Interviewing", offer_extended: "Offer", placed: "Placed", declined_withdrawn: "Disinterested",
  further_skilling: "Further Skilling", unreachable: "Unreachable / Offline"
};

type NewAllocations = Record<string, { id: string; assignedAt: string }>;

export default function PipelineView({ cards, newAllocations = {} }: { cards: Card[]; newAllocations?: NewAllocations }) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [stageFilter, setStageFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [readinessFilter, setReadinessFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const newCount = cards.filter((c) => newAllocations[c.student_id]).length;

  const programs = Array.from(new Set(cards.map((c) => c.program_name).filter(Boolean))) as string[];

  function runSearch() { setSearchTerm(searchInput.trim().toLowerCase()); }

  const filtered = useMemo(() => cards.filter((c) => {
    if (stageFilter && c.placement_status !== stageFilter) return false;
    if (riskFilter && c.risk_flag !== riskFilter) return false;
    if (readinessFilter && c.overall_readiness !== readinessFilter) return false;
    if (programFilter && c.program_name !== programFilter) return false;
    if (searchTerm && !c.full_name.toLowerCase().includes(searchTerm)) return false;
    if (newOnly && !newAllocations[c.student_id]) return false;
    return true;
  }), [cards, stageFilter, riskFilter, readinessFilter, programFilter, searchTerm, newOnly, newAllocations]);

  return (
    <div className="space-y-4">
      {newCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <p>
            <span className="font-semibold text-accent">{newCount} new allocation{newCount === 1 ? "" : "s"}.</span>{" "}
            <span className="text-ink/70">These students have been in the system before - review each one, then mark it as seen.</span>
          </p>
          <button type="button" onClick={() => setNewOnly(!newOnly)} aria-pressed={newOnly}
            className={clsx("rounded-md px-3 py-1.5 text-xs font-medium", newOnly ? "bg-brand text-white" : "border border-accent/40 text-accent hover:bg-accent/10")}>
            {newOnly ? "Show everyone" : "Show new allocations only"}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="">All stages</option>
          {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="">All risk levels</option>
          <option value="red">At risk (red)</option><option value="yellow">Watch (yellow)</option><option value="none">No flag</option>
        </select>
        <select value={readinessFilter} onChange={(e) => setReadinessFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="">All readiness</option>
          <option value="green">Green</option><option value="amber">Amber</option><option value="red">Red</option>
        </select>
        {programs.length > 0 && (
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
            <option value="">All programs</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        <div className="flex">
          <input type="text" placeholder="Search by name…" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            className="w-52 rounded-l-md border border-border px-3 py-1.5 text-sm" />
          <button onClick={runSearch} className="rounded-r-md border border-l-0 border-border bg-ink/5 px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/10">
            Search
          </button>
        </div>

        <ExportButton data={filtered as any} filename="my_caseload" />
        <div className="ml-auto flex gap-1 rounded-md border border-border p-0.5">
          <button onClick={() => setView("table")} className={clsx("rounded px-3 py-1 text-xs font-medium", view === "table" ? "bg-brand text-white" : "text-ink/60")}>Table</button>
          <button onClick={() => setView("kanban")} className={clsx("rounded px-3 py-1 text-xs font-medium", view === "kanban" ? "bg-brand text-white" : "text-ink/60")}>Kanban</button>
        </div>
      </div>

      {view === "table" ? (
        <ClientPaginator items={filtered}>
          {(pageItems) => (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Track</th><th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Stage</th><th className="px-4 py-3">Days in stage</th><th className="px-4 py-3">Apps logged</th>
                    <th className="px-4 py-3">Readiness</th><th className="px-4 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((c) => (
                    <tr key={c.student_id} className="hover:bg-ink/[0.02]">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/students/${c.student_id}`} className="hover:text-accent hover:underline">{c.full_name}</Link>
                        {newAllocations[c.student_id] && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <NewAllocationBadge assignedAt={newAllocations[c.student_id].assignedAt} />
                            <MarkSeenButton allocationId={newAllocations[c.student_id].id} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/70">{c.track ?? "—"}</td>
                      <td className="px-4 py-3 text-ink/70">{c.program_name ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.placement_status ?? "awaiting_placement"} /></td>
                      <td className="px-4 py-3 text-ink/70">{c.days_in_stage ?? "—"}d</td>
                      <td className="px-4 py-3 text-ink/70">{c.applications_logged}</td>
                      <td className="px-4 py-3">{c.overall_readiness ? <RagBadge status={c.overall_readiness} placementStatus={c.placement_status} /> : "—"}</td>
                      <td className="px-4 py-3"><RiskBadge risk={c.risk_flag} /></td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-ink/40">No students match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </ClientPaginator>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Object.entries(STAGE_LABELS).filter(([k]) => k !== "in_preparation").map(([stageKey, stageLabel]) => {
            const stageCards = filtered.filter((c) => c.placement_status === stageKey || (stageKey === "awaiting_placement" && c.placement_status === "in_preparation"));
            return (
              <div key={stageKey} className="w-64 flex-shrink-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">{stageLabel} ({stageCards.length})</p>
                <div className="space-y-2">
                  {stageCards.map((c) => (
                    <Link key={c.student_id} href={`/students/${c.student_id}`}
                      className="block rounded-lg border border-border bg-surface p-3 hover:border-brand">
                      <p className="text-sm font-medium">{c.full_name}</p>
                      {newAllocations[c.student_id] && <div className="my-1"><NewAllocationBadge assignedAt={newAllocations[c.student_id].assignedAt} /></div>}
                      <p className="text-xs text-ink/50">{c.program_name ?? "No program on record"}</p>
                      {c.track && <p className="text-xs text-ink/40">Track: {c.track}</p>}
                      <div className="mt-2"><ReadinessBar green={c.green_count} amber={c.amber_count} red={c.red_count} placementStatus={c.placement_status} /></div>
                      <div className="mt-2 flex items-center justify-between text-xs text-ink/50">
                        <span>{c.days_in_stage ?? "—"}d in stage</span>
                        <RiskBadge risk={c.risk_flag} />
                      </div>
                    </Link>
                  ))}
                  {stageCards.length === 0 && <p className="text-xs text-ink/30">No students</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}