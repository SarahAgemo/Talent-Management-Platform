/**

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
  "assigned_staff_name", "placement_notes", "completion_status", "student_id"
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
    "Completion Status": r.completion_status === "not_graduated" ? "Not Graduated" : "Graduated",
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
    const completion = searchParams.get("completion");

    let all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      // student_id breaks ties so the pages never overlap or skip anyone
      let query = supabase.from("student_overview").select(EXPORT_COLUMNS)
        .order("graduation_date", { ascending: false, nullsFirst: false })
        .order("student_id", { ascending: true });
      if (status) query = query.eq("placement_status", status);
      if (program) query = query.eq("program_name", program);
      if (q) query = query.ilike("full_name", `%${q}%`);
      if (completion === "graduated" || completion === "not_graduated") query = query.eq("completion_status", completion);
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
**/

"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { exportToCSV, exportToXLSX } from "@/lib/exportUtils";
import { applyPlacedFilter, ordersByPlacementDate, readPlacedFilter, shortDate, ugandaTodayDayNumber } from "@/lib/placedFilter";
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
  "assigned_staff_name", "placement_notes", "completion_status", "student_id", "ten_x_id"
].join(", ");

// Every progress comment goes into one "Comments" cell, newest first:
//   [17 Nov 2026, Brian] Unreachable / offline
//   [10 Nov 2026, Joan] Called twice, no answer
// The brackets keep the entries apart even where a spreadsheet shows the
// cell on one line. Dates are Uganda dates.
const COMMENT_CHUNK = 100;        // students per request
const PARALLEL_REQUESTS = 4;
const MAX_CELL_LENGTH = 32000;    // Excel's limit for one cell is 32,767 characters

// "17 Nov 2026": the date in Uganda when the comment was posted
function commentDate(value: string) {
  return shortDate(ugandaTodayDayNumber(new Date(value)));
}

async function fetchCommentsByStudent(supabase: ReturnType<typeof createClient>, studentIds: string[]) {
  const lines = new Map<string, string[]>();
  const chunks: string[][] = [];
  for (let i = 0; i < studentIds.length; i += COMMENT_CHUNK) chunks.push(studentIds.slice(i, i + COMMENT_CHUNK));

  async function loadChunk(ids: string[]) {
    const rows: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("student_comments")
        .select("id, student_id, comment, created_at, staff_users(name)")
        .in("student_id", ids)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + 999);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return rows;
  }

  for (let i = 0; i < chunks.length; i += PARALLEL_REQUESTS) {
    const results = await Promise.all(chunks.slice(i, i + PARALLEL_REQUESTS).map(loadChunk));
    for (const rows of results) {
      for (const c of rows) {
        const staff = Array.isArray(c.staff_users) ? c.staff_users[0]?.name : c.staff_users?.name;
        const line = `[${commentDate(c.created_at)}, ${staff ?? "Unknown"}] ${String(c.comment ?? "").trim()}`;
        const list = lines.get(c.student_id);
        if (list) list.push(line); else lines.set(c.student_id, [line]);
      }
    }
  }

  const byStudent = new Map<string, string>();
  lines.forEach((list, studentId) => {
    let text = list.join("\n");
    if (text.length > MAX_CELL_LENGTH) {
      text = text.slice(0, MAX_CELL_LENGTH) + "\n[... older comments are on the student's profile]";
    }
    byStudent.set(studentId, text);
  });
  return byStudent;
}

// Readable headers and human labels, so the exported file is usable for
// reporting as-is — no decoding "awaiting_placement" or "self_employed".
function toExportRow(r: any, comments: string) {
  return {
    "10X ID": r.ten_x_id,
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
    "Completion Status": r.completion_status === "not_graduated" ? "Not Graduated" : "Graduated",
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
    "Placement Notes": r.placement_notes,
    "Comments": comments
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
    const completion = searchParams.get("completion");
    const tenx = searchParams.get("tenx");
    const sponsor = searchParams.get("sponsor");
    const placedFilter = readPlacedFilter((key) => searchParams.get(key));
    const today = ugandaTodayDayNumber();

    let all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      // student_id breaks ties so the pages never overlap or skip anyone
      // Same order and filters as the Student Directory page.
      let query = supabase.from("student_overview").select(EXPORT_COLUMNS)
        .order(ordersByPlacementDate(placedFilter) ? "placement_date" : "graduation_date",
          ordersByPlacementDate(placedFilter) ? { ascending: true } : { ascending: false, nullsFirst: false })
        .order("student_id", { ascending: true });
      if (status && placedFilter.kind === "none") query = query.eq("placement_status", status);
      query = applyPlacedFilter(query, placedFilter, today);
      if (program) query = query.eq("program_name", program);
      if (q) query = query.ilike("full_name", `%${q}%`);
      if (completion === "graduated" || completion === "not_graduated") query = query.eq("completion_status", completion);
      if (tenx === "in") query = query.not("ten_x_id", "is", null);
      else if (tenx === "out") query = query.is("ten_x_id", null);
      if (sponsor) query = query.ilike("sponsorship_type", sponsor.replace(/[\\%_]/g, (c: string) => "\\" + c));
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
    const comments = await fetchCommentsByStudent(supabase, all.map((r) => r.student_id));
    return all.map((r) => toExportRow(r, comments.get(r.student_id) ?? ""));
  }

  async function handleExport(format: "csv" | "xlsx" | "print") {
    setOpen(false);
    setExportError(null);
    if (format === "print") { window.print(); return; }
    setLoading(true);
    try {
      const rows = await fetchAllFiltered();
      // e.g. students_placed_2026-10 when a "Placed in" period is chosen
      const placedFilter = readPlacedFilter((key) => searchParams.get(key));
      const filename = placedFilter.kind === "none" ? "student_directory" : `students_placed_${placedFilter.slug}`;
      if (format === "csv") exportToCSV(rows, filename);
      else await exportToXLSX(rows, filename);
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
