"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { exportToCSV, exportToXLSX } from "@/lib/exportUtils";
import { STATUS_LABELS } from "./StatusBadge";

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", freelance: "Freelance / Gig Work",
  contract: "Contract", internship: "Internship", unpaid_internship: "Unpaid Internship",
  self_employed: "Self-Employed", further_skilling: "Further Skilling"
};
const EMPLOYMENT_CATEGORY_LABELS: Record<string, string> = {
  new_employment: "New Employment", improved_employment: "Improved Employment"
};
const IMPROVEMENT_LABELS: Record<string, string> = {
  income_increase: "Income Increase", improved_working_conditions: "Improved Working Conditions", other: "Other"
};

const EXPORT_COLUMNS = [
  "full_name", "email", "phone_number", "gender", "nationality", "location", "education_level",
  "refugee_status", "disability_status", "disability_type", "sponsorship_type",
  "program_name", "cohort_name", "graduation_date", "days_since_graduation",
  "placement_status", "company_name", "position_title", "employment_type", "employment_category",
  "improvement_type", "improvement_other_detail", "placement_date", "salary_compensation",
  "youth_employed_count", "employees_female", "employees_male", "employees_below_18",
  "employees_18_35", "employees_above_35", "employees_ugandan", "employees_non_ugandan",
  "technical_skills", "technical_proficiency", "career_track_interest",
  "assigned_staff_name", "placement_notes"
].join(", ");

// Readable headers and human labels, so the exported file is usable for
// reporting as-is — no decoding "awaiting_placement" or "self_employed".
function toExportRow(r: any) {
  return {
    "Full Name": r.full_name,
    "Email": r.email,
    "Phone Number": r.phone_number,
    "Gender": r.gender,
    "Nationality": r.nationality,
    "Location": r.location,
    "Education Level": r.education_level,
    "Refugee Status": r.refugee_status,
    "Disability Status": r.disability_status,
    "Type of Disability": r.disability_type,
    "Sponsorship Type": r.sponsorship_type,
    "Program": r.program_name,
    "Cohort": r.cohort_name,
    "Graduation Date": r.graduation_date,
    "Days Since Graduation": r.days_since_graduation,
    "Placement Status": STATUS_LABELS[r.placement_status] ?? r.placement_status,
    "Company": r.company_name,
    "Position Title": r.position_title,
    "Employment Type": EMPLOYMENT_TYPE_LABELS[r.employment_type] ?? r.employment_type,
    "Employment Category": EMPLOYMENT_CATEGORY_LABELS[r.employment_category] ?? r.employment_category,
    "What Improved": r.improvement_type === "other" ? r.improvement_other_detail : (IMPROVEMENT_LABELS[r.improvement_type] ?? r.improvement_type),
    "Placement Date": r.placement_date,
    "Salary / Compensation": r.salary_compensation,
    "Youth Employed in Business": r.youth_employed_count,
    "Employed - Female": r.employees_female,
    "Employed - Male": r.employees_male,
    "Employed - Below 18": r.employees_below_18,
    "Employed - 18 to 35": r.employees_18_35,
    "Employed - Above 35": r.employees_above_35,
    "Employed - Ugandan": r.employees_ugandan,
    "Employed - Non-Ugandan": r.employees_non_ugandan,
    "Technical Skills": r.technical_skills,
    "Technical Proficiency": r.technical_proficiency,
    "Career Track of Interest": r.career_track_interest,
    "Assigned To": r.assigned_staff_name,
    "Placement Notes": r.placement_notes
  };
}

export default function ExportStudentsButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function fetchAllFiltered() {
    const status = searchParams.get("status");
    const program = searchParams.get("program");
    const q = searchParams.get("q");
    const inclusion = searchParams.get("inclusion");
    const staff = searchParams.get("staff");

    let all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      let query = supabase.from("student_overview").select(EXPORT_COLUMNS).order("graduation_date", { ascending: false });
      if (status) query = query.eq("placement_status", status);
      if (program) query = query.eq("program_name", program);
      if (q) query = query.ilike("full_name", `%${q}%`);
      if (inclusion === "1") query = query.eq("needs_inclusion_support", true);
      if (staff === "__unassigned__") query = query.is("assigned_staff_name", null);
      else if (staff === "__assigned__") query = query.not("assigned_staff_name", "is", null);
      else if (staff) query = query.eq("assigned_staff_name", staff);

      const { data, error } = await query.range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all.map(toExportRow);
  }

  async function handleExport(format: "csv" | "xlsx" | "print") {
    setOpen(false);
    setExportError(null);
    if (format === "print") { window.print(); return; }
    setLoading(true);
    try {
      const rows = await fetchAllFiltered();
      if (format === "csv") exportToCSV(rows, "student_directory");
      else await exportToXLSX(rows, "student_directory");
    } catch (err: any) {
      setExportError("Export failed — if this persists, check that the latest database migration has been run.");
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
      {exportError && <p className="absolute right-0 mt-1 w-64 text-xs text-danger">{exportError}</p>}
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
