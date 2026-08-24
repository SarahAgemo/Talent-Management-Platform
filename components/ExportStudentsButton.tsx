"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { exportToCSV, exportToXLSX } from "@/lib/exportUtils";

export default function ExportStudentsButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function fetchAllFiltered() {
    let query = supabase
      .from("student_overview")
      .select("full_name, program_name, cohort_name, graduation_date, placement_status, company_name, position_title, days_since_graduation, assigned_staff_name, disability_status, refugee_status")
      .order("graduation_date", { ascending: false });

    const status = searchParams.get("status");
    const program = searchParams.get("program");
    const q = searchParams.get("q");
    const inclusion = searchParams.get("inclusion");
    const staff = searchParams.get("staff");

    if (status) query = query.eq("placement_status", status);
    if (program) query = query.eq("program_name", program);
    if (q) query = query.ilike("full_name", `%${q}%`);
    if (inclusion === "1") query = query.eq("needs_inclusion_support", true);
    if (staff === "__unassigned__") query = query.is("assigned_staff_name", null);
    else if (staff) query = query.eq("assigned_staff_name", staff);

    // Same 1000-row API cap applies here — page through it.
    let all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await query.range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  }

  async function handleExport(format: "csv" | "xlsx" | "print") {
    setOpen(false);
    if (format === "print") { window.print(); return; }
    setLoading(true);
    try {
      const rows = await fetchAllFiltered();
      if (format === "csv") exportToCSV(rows, "student_directory");
      else await exportToXLSX(rows, "student_directory");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-60">
        {loading ? "Preparing…" : "Export ▾"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-border bg-surface shadow-lg">
            <button onClick={() => handleExport("csv")} className="block w-full px-3 py-2 text-left text-sm text-ink/80 hover:bg-brand/10">Download CSV (all matching)</button>
            <button onClick={() => handleExport("xlsx")} className="block w-full px-3 py-2 text-left text-sm text-ink/80 hover:bg-brand/10">Download Excel (all matching)</button>
            <button onClick={() => handleExport("print")} className="block w-full px-3 py-2 text-left text-sm text-ink/80 hover:bg-brand/10">Print / Save as PDF (this page)</button>
          </div>
        </>
      )}
    </div>
  );
}
