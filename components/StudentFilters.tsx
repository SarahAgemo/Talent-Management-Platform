
/** 
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
  const activeCompletion = searchParams.get("completion");
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
          <option value="">All students</option>
          <option value="__assigned__">Assigned to: anyone</option>
          <option value="__unassigned__">Unassigned only</option>
          {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <select value={activeCompletion ?? ""} onChange={(e) => setParam("completion", e.target.value || null)}
          className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="">Graduated &amp; not graduated</option>
          <option value="graduated">Graduated only</option>
          <option value="not_graduated">Not graduated only</option>
        </select>

        <button onClick={() => setParam("inclusion", inclusionOnly ? null : "1")}
          className={clsx("status-pill border", inclusionOnly ? "border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300" : "border-border text-ink/60 hover:bg-ink/5")}>
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
**/

"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { STATUS_LABELS } from "./StatusBadge";
import { MONTH_NAMES, dayBuckets, monthBucket, toDayNumber, weekBuckets } from "@/lib/reportPeriods";
import { NO_DATE, isoFromDay, ugandaTodayDayNumber } from "@/lib/placedFilter";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
const CLEAR_PERIOD = { placedYear: null, placedMonth: null, placedWeek: null, placedDay: null };
const CLEAR_RANGE = { placedFrom: null, placedTo: null };
const CLEAR_PLACED = { ...CLEAR_PERIOD, ...CLEAR_RANGE };
const SELECT = "rounded-md border border-border px-3 py-1.5 text-sm";
const SELECT_DISABLABLE = `${SELECT} disabled:cursor-not-allowed disabled:opacity-50`;

export default function StudentFilters({ programs, staff, sponsorships = [], placedYears = [] }: { programs: { id: string; name: string }[]; staff: { id: string; name: string }[]; sponsorships?: string[]; placedYears?: number[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status");
  const activeProgram = searchParams.get("program");
  const activeStaff = searchParams.get("staff");
  const activeCompletion = searchParams.get("completion");
  const activeTenx = searchParams.get("tenx");
  const activeSponsor = searchParams.get("sponsor");
  const inclusionOnly = searchParams.get("inclusion") === "1";
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");

  const today = ugandaTodayDayNumber();
  const todayIso = isoFromDay(today);

  // "Placed in", by period: Year -> Month -> Week -> Day (same periods as the Dashboard).
  const placedYear = searchParams.get("placedYear") ?? "";
  const yearNum = /^\d{4}$/.test(placedYear) ? Number(placedYear) : null;
  const monthValue = searchParams.get("placedMonth") ?? "";
  const monthNum = yearNum !== null && /^([1-9]|1[0-2])$/.test(monthValue) ? Number(monthValue) : null;
  const weeks = yearNum !== null && monthNum !== null ? weekBuckets(yearNum, monthNum) : [];
  const weekValue = searchParams.get("placedWeek") ?? "";
  const weekIndex = /^[1-6]$/.test(weekValue) ? Number(weekValue) : null;
  const week = weekIndex !== null ? weeks[weekIndex - 1] : undefined;
  const days = week ? dayBuckets(week) : [];
  const dayValue = searchParams.get("placedDay") ?? "";
  const dayChosen = days.some((d) => isoFromDay(d.start) === dayValue) ? dayValue : "";

  // "Placed in", by date range: From / To, both days included.
  const urlFrom = toDayNumber(searchParams.get("placedFrom")) !== null ? searchParams.get("placedFrom")!.slice(0, 10) : "";
  const urlTo = toDayNumber(searchParams.get("placedTo")) !== null ? searchParams.get("placedTo")!.slice(0, 10) : "";
  const rangeActive = urlFrom !== "" || urlTo !== "";
  const periodActive = !rangeActive && placedYear !== "";
  const placedActive = rangeActive || periodActive;
  const [chosenMode, setChosenMode] = useState<"period" | "range">(rangeActive ? "range" : "period");
  const mode = rangeActive ? "range" : periodActive ? "period" : chosenMode;
  const [fromText, setFromText] = useState(urlFrom);
  const [toText, setToText] = useState(urlTo);
  useEffect(() => { setFromText(urlFrom); setToText(urlTo); }, [urlFrom, urlTo]);
  const rangeChanged = fromText !== urlFrom || toText !== urlTo;
  const rangeBackwards = fromText !== "" && toText !== "" && fromText > toText;

  function setParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    params.delete("page");
    router.push(`/students?${params.toString()}`);
  }

  function setParam(key: string, value: string | null) { setParams({ [key]: value }); }

  function runSearch() { setParam("q", searchText.trim() || null); }

  // A "Placed in" period or range shows Placed students, so the Status list
  // shows Placed; choosing any other status (or All) removes the period/range.
  function changeStatus(value: string) {
    if (value === "placed") setParams({ status: "placed" });
    else setParams({ status: value || null, ...CLEAR_PLACED });
  }

  function switchMode(next: "period" | "range") {
    if (next === mode) return;
    setChosenMode(next);
    if (placedActive) setParams(CLEAR_PLACED);
  }

  function applyRange() {
    if (rangeBackwards) return;
    setParams({ ...CLEAR_PERIOD, placedFrom: fromText || null, placedTo: toText || null, status: null });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Status" value={placedActive ? "placed" : activeStatus ?? ""} onChange={(e) => changeStatus(e.target.value)} className={SELECT}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
        </select>

        <select value={activeProgram ?? ""} onChange={(e) => setParam("program", e.target.value || null)} className={SELECT}>
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>

        <select value={activeStaff ?? ""} onChange={(e) => setParam("staff", e.target.value || null)} className={SELECT}>
          <option value="">All students</option>
          <option value="__assigned__">Assigned to: anyone</option>
          <option value="__unassigned__">Unassigned only</option>
          {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <select value={activeCompletion ?? ""} onChange={(e) => setParam("completion", e.target.value || null)} className={SELECT}>
          <option value="">Graduated &amp; not graduated</option>
          <option value="graduated">Graduated only</option>
          <option value="not_graduated">Not graduated only</option>
        </select>

        <select value={activeTenx ?? ""} onChange={(e) => setParam("tenx", e.target.value || null)} className={SELECT}>
          <option value="">In &amp; not in the 10X file</option>
          <option value="in">In the 10X file</option>
          <option value="out">Not in the 10X file</option>
        </select>

        <select value={activeSponsor ?? ""} onChange={(e) => setParam("sponsor", e.target.value || null)} className={SELECT}>
          <option value="">All sponsors</option>
          {sponsorships.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <button onClick={() => setParam("inclusion", inclusionOnly ? null : "1")}
          className={clsx("status-pill border", inclusionOnly ? "border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300" : "border-border text-ink/60 hover:bg-ink/5")}>
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

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-brand/5 px-3 py-2">
        <span className="mr-1 text-sm font-medium text-brand">Placed</span>
        <div role="group" aria-label="Placed by period or date range" className="inline-flex overflow-hidden rounded-md border border-border text-xs">
          {(["period", "range"] as const).map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)} aria-pressed={mode === m}
              className={clsx("px-2.5 py-1.5 font-medium", mode === m ? "bg-brand text-white" : "bg-surface text-ink/60 hover:bg-ink/5")}>
              {m === "period" ? "By period" : "Date range"}
            </button>
          ))}
        </div>

        {mode === "period" ? (
          <>
            <select aria-label="Placed in year" value={periodActive && (yearNum !== null || placedYear === NO_DATE) ? placedYear : ""}
              onChange={(e) => setParams({ ...CLEAR_PLACED, placedYear: e.target.value || null, status: null })} className={SELECT}>
              <option value="">Any time</option>
              {placedYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              <option value={NO_DATE}>No date recorded</option>
            </select>
            <select aria-label="Placed in month" value={monthNum !== null ? String(monthNum) : ""} disabled={yearNum === null}
              onChange={(e) => setParams({ placedMonth: e.target.value || null, placedWeek: null, placedDay: null })} className={SELECT_DISABLABLE}>
              <option value="">{yearNum === null ? "Month" : "All months"}</option>
              {yearNum !== null && MONTH_NAMES.map((name, i) => (
                <option key={name} value={String(i + 1)} disabled={monthBucket(yearNum, i + 1).start > today}>{name}</option>
              ))}
            </select>
            <select aria-label="Placed in week" value={week ? String(weekIndex) : ""} disabled={weeks.length === 0}
              onChange={(e) => setParams({ placedWeek: e.target.value || null, placedDay: null })} className={SELECT_DISABLABLE}>
              <option value="">{weeks.length ? "All weeks" : "Week"}</option>
              {weeks.map((w, i) => <option key={w.key} value={String(i + 1)} disabled={w.start > today}>{w.label}</option>)}
            </select>
            <select aria-label="Placed on day" value={dayChosen} disabled={days.length === 0}
              onChange={(e) => setParams({ placedDay: e.target.value || null })} className={SELECT_DISABLABLE}>
              <option value="">{days.length ? "All days" : "Day"}</option>
              {days.map((d) => <option key={d.key} value={isoFromDay(d.start)} disabled={d.start > today}>{d.label}</option>)}
            </select>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); applyRange(); }} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-ink/70">
              From
              <input type="date" aria-label="Placed from" value={fromText} max={toText || todayIso}
                onChange={(e) => setFromText(e.target.value)} className={SELECT} />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink/70">
              To
              <input type="date" aria-label="Placed to" value={toText} min={fromText || undefined} max={todayIso}
                onChange={(e) => setToText(e.target.value)} className={SELECT} />
            </label>
            <button type="submit" disabled={!rangeChanged || rangeBackwards}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
              Apply
            </button>
            {rangeBackwards && <span className="text-xs text-danger">The From date is after the To date.</span>}
          </form>
        )}

        {placedActive && (
          <>
            <span className="text-xs text-ink/50">
              {placedYear === NO_DATE && !rangeActive
                ? "Placed students with no placement date, or a date still to come"
                : rangeActive ? "Placed students, both dates included, in the order they were placed" : "Placed students, listed in the order they were placed"}
            </span>
            <button onClick={() => setParams(CLEAR_PLACED)} className="ml-auto text-xs font-medium text-accent hover:underline">Clear</button>
          </>
        )}
      </div>
    </div>
  );
}
