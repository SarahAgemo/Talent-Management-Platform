import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function mapStatusAndEmploymentType(raw: string | undefined): { status: string; employmentType: string | null } {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return { status: "awaiting_placement", employmentType: null };

  if (v.includes("back to school") || v === "student") {
    return { status: "further_skilling", employmentType: null };
  }
  if (v.includes("open to work")) {
    return { status: "awaiting_placement", employmentType: null };
  }
  if (v.includes("self employ") || v.includes("self-employ")) {
    return { status: "placed", employmentType: "self_employed" };
  }
  if (v.includes("freelanc") || v.includes("gig")) {
    return { status: "placed", employmentType: "freelance" };
  }
  if (v.includes("volunteer")) {
    return { status: "placed", employmentType: "unpaid_internship" };
  }
  if (v.includes("intern")) {
    return { status: "placed", employmentType: "internship" };
  }
  if (v.includes("employ") || v.includes("emloy") || v.includes("placed")) {
    return { status: "placed", employmentType: null };
  }
  if (v.includes("interview")) return { status: "interviewing", employmentType: null };
  if (v.includes("offer")) return { status: "offer_extended", employmentType: null };
  if (v.includes("apply") || v.includes("applying")) return { status: "applying", employmentType: null };
  if (v.includes("prep")) return { status: "in_preparation", employmentType: null };
  if (v.includes("decline") || v.includes("withdraw")) return { status: "declined_withdrawn", employmentType: null };
  if (v.includes("further skill")) return { status: "further_skilling", employmentType: null };

  return { status: "awaiting_placement", employmentType: null };
}

function mapEmploymentTypeFromTitle(raw: string | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (v.includes("intern")) return "internship";
  if (v.includes("freelance")) return "freelance";
  if (v.includes("contract")) return "contract";
  if (v.includes("part-time") || v.includes("part time")) return "part_time";
  return null;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
};

// Robust date parsing, tried in order of likelihood for this dataset.
// JavaScript's native `new Date(string)` is NOT trusted here at all —
// it mishandles ambiguous slash dates (assumes US MM/DD/YYYY) AND fails
// outright on ordinal suffixes like "5th"/"26th", both of which showed
// up in real data from this tracker.
function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  // Strip ordinal suffixes up front (5th -> 5, 26th -> 26, 1st -> 1, 3rd -> 3, 22nd -> 22)
  const trimmed = String(raw).trim().replace(/(\d+)(st|nd|rd|th)\b/gi, "$1");
  if (!trimmed) return null;

  // Already ISO: YYYY-MM-DD (optionally with a time component)
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    let [, day, month, year] = dmy;
    let d = parseInt(day, 10);
    let m = parseInt(month, 10);
    if (m > 12 && d <= 12) [d, m] = [m, d];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return null;
  }

  // "5 Dec 2025", "5 December 2025" — day, month name, year
  const dMonY = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/);
  if (dMonY) {
    const [, day, monthName, year] = dMonY;
    const m = MONTH_NAMES[monthName.toLowerCase()];
    if (m) return `${year}-${String(m).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // "December 5, 2025" / "Dec 5 2025" — month name, day, year
  const monDY = trimmed.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDY) {
    const [, monthName, day, year] = monDY;
    const m = MONTH_NAMES[monthName.toLowerCase()];
    if (m) return `${year}-${String(m).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Excel serial date number (e.g. a cell that lost its date formatting on export)
  if (/^\d{4,6}$/.test(trimmed)) {
    const serial = parseInt(trimmed, 10);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + serial * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  // Last resort — anything else the native parser can actually handle safely.
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const { rows } = await req.json();
  const supabase = createAdminClient();
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  const programCache = new Map<string, string>();
  const cohortCache = new Map<string, string>();

  for (const [i, row] of (rows as any[]).entries()) {
    try {
      const fullName = row["Full Name"]?.trim();
      if (!fullName) {
        errors.push(`Row ${i + 2}: missing Full Name, skipped.`);
        continue;
      }

      const programName = row["Program Name"]?.trim() || "Unspecified Program";
      let programId = programCache.get(programName);
      if (!programId) {
        const { data: existing } = await supabase.from("programs").select("id").eq("name", programName).maybeSingle();
        if (existing) programId = existing.id;
        else {
          const { data: created, error } = await supabase.from("programs").insert({ name: programName, level: "Unspecified" }).select("id").single();
          if (error) throw error;
          programId = created.id;
        }
        programCache.set(programName, programId!);
      }

      const cohortName = row["Cohort"]?.trim() || "Unspecified Cohort";
      const cohortKey = `${programId}:${cohortName}`;
      let cohortId = cohortCache.get(cohortKey);
      if (!cohortId) {
        const { data: existing } = await supabase.from("cohorts").select("id").eq("program_id", programId).eq("cohort_name", cohortName).maybeSingle();
        if (existing) cohortId = existing.id;
        else {
          const { data: created, error } = await supabase.from("cohorts").insert({ program_id: programId, cohort_name: cohortName }).select("id").single();
          if (error) throw error;
          cohortId = created.id;
        }
        cohortCache.set(cohortKey, cohortId!);
      }

      const email = row["Email"]?.trim() || null;
      let student: { id: string } | null = null;
      let isUpdate = false;

      if (email) {
        const { data: existing } = await supabase.from("students").select("id").eq("email", email).maybeSingle();
        if (existing) {
          const { data: updatedRow, error: updateError } = await supabase
            .from("students")
            .update({
              full_name: fullName,
              gender: row["Gender"] || null,
              nationality: row["Nationality"] || null,
              refugee_status: row["Refugee Status"] || null,
              disability_status: row["Disability status"] || null,
              disability_type: row["Type of Disability"] || null,
              phone_number: row["Phone Number"] || null,
              sponsorship_type: row["Sponsorship Type"] || null,
              education_level: row["Education Level"] || null,
              technical_skills: row["Technical Languages"] || null,
              technical_proficiency: row["Technical Proficiency"] || null,
              career_track_interest: row["Career Track of Interest"] || null
            })
            .eq("id", existing.id).select("id").single();
          if (updateError) throw updateError;
          student = updatedRow;
          isUpdate = true;
        }
      }

      if (!student) {
        const { data: created, error: studentError } = await supabase
          .from("students")
          .insert({
            full_name: fullName,
            gender: row["Gender"] || null,
            nationality: row["Nationality"] || null,
            refugee_status: row["Refugee Status"] || null,
            disability_status: row["Disability status"] || null,
            disability_type: row["Type of Disability"] || null,
            email, phone_number: row["Phone Number"] || null,
            sponsorship_type: row["Sponsorship Type"] || null,
            education_level: row["Education Level"] || null,
            technical_skills: row["Technical Languages"] || null,
            technical_proficiency: row["Technical Proficiency"] || null,
            career_track_interest: row["Career Track of Interest"] || null
          })
          .select("id").single();
        if (studentError) throw studentError;
        student = created;
      }

      const graduationDate = parseDate(row["Graduation Date"]);
      if (!graduationDate) {
        errors.push(`Row ${i + 2} (${fullName}): couldn't parse Graduation Date "${row["Graduation Date"] ?? ""}", enrollment skipped.`);
      } else {
        const { data: existingEnrollment } = await supabase
          .from("enrollments").select("id").eq("student_id", student.id).eq("cohort_id", cohortId).maybeSingle();
        if (!existingEnrollment) {
          const { error: enrollError } = await supabase.from("enrollments").insert({ student_id: student.id, cohort_id: cohortId, graduation_date: graduationDate });
          if (enrollError) throw enrollError;
        }
      }

      const { status, employmentType } = mapStatusAndEmploymentType(row["Placement Status"]);

      const placementPayload: Record<string, any> = {
        student_id: student.id,
        status,
        company_name: row["Company Name"] || null,
        position_title: row["Position Title"] || null,
        employment_type: employmentType ?? mapEmploymentTypeFromTitle(row["Position Title"]),
        placement_date: parseDate(row["Placement Date"]),
        salary_compensation: row["Salary/Compensation"] || null
      };
      if (!isUpdate && row["Notes"]) placementPayload.notes = row["Notes"];

      const { error: placementError } = await supabase.from("placements").upsert(placementPayload, { onConflict: "student_id" });
      if (placementError) throw placementError;

      if (isUpdate) updated++; else inserted++;
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message ?? "unknown error"}`);
    }
  }

  return NextResponse.json({ inserted, updated, errors });
}