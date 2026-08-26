export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import StatusBadge, { InclusionBadge } from "@/components/StatusBadge";
import PlacementForm from "@/components/PlacementForm";
import CvUpload from "@/components/CvUpload";
import CommentsSection from "@/components/CommentsSection";
import JobFitSuggestion from "@/components/JobFitSuggestion";
import StudentDetailsForm from "@/components/StudentDetailsForm";
import SkillsetForm from "@/components/SkillsetForm";
import ReadinessChecklist from "@/components/ReadinessChecklist";
import ActivityLog from "@/components/ActivityLog";
import { RiskBadge } from "@/components/RagBadge";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user ? await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const isAdmin = me?.role === "super_admin" || me?.role === "placement_admin";
  const isReadOnly = me?.role === "read_only";

  const { data: student } = await supabase.from("student_overview").select("*").eq("student_id", params.id).single();
  if (!student) notFound();

  const { data: placement } = await supabase.from("placements").select("*").eq("student_id", params.id).single();

  const { data: history } = placement
    ? await supabase.from("placement_status_history").select("status, changed_at").eq("placement_id", placement.id).order("changed_at", { ascending: false })
    : { data: [] };

  const { data: allocationTrail } = await supabase
    .from("allocation_trail")
    .select("*")
    .eq("student_id", params.id);

  const isAllocatedToMe = (allocationTrail ?? []).some((a: any) => a.allocation_status === "active" && a.assigned_to === user?.id);
  const canEdit = !isReadOnly && (isAdmin || isAllocatedToMe);

  const { data: documents } = await supabase
    .from("student_documents").select("id, file_url, file_name, is_current, uploaded_at")
    .eq("student_id", params.id).order("uploaded_at", { ascending: false });

  const { data: comments } = await supabase
    .from("student_comments").select("id, comment, created_at, staff_users(name)")
    .eq("student_id", params.id).order("created_at", { ascending: false });

  const { data: readinessItems } = await supabase.from("readiness_checklist").select("item_key, status, flowmingo_used").eq("student_id", params.id);
  const { data: activityEntries } = await supabase
    .from("student_activity_log").select("id, activity_type, quantity, income_amount, notes, logged_at, staff_users(name)")
    .eq("student_id", params.id).order("logged_at", { ascending: false }).limit(20);
  const { data: risk } = await supabase.from("student_risk_overview").select("*").eq("student_id", params.id).maybeSingle();

  const { data: programHistoryRaw } = await supabase
    .from("enrollments")
    .select("id, graduation_date, cohorts(cohort_name, programs(name, level))")
    .eq("student_id", params.id)
    .order("graduation_date", { ascending: false });

  const programHistory = (programHistoryRaw ?? []).map((e: any) => ({
    id: e.id,
    graduation_date: e.graduation_date,
    cohort_name: e.cohorts?.cohort_name ?? null,
    program_name: e.cohorts?.programs?.name ?? null,
    program_level: e.cohorts?.programs?.level ?? null
  }));

  let jobFitRoles: string[] = [];
  if (student.program_id) {
    const { data: rule } = await supabase.from("job_fit_rules").select("suggested_roles").eq("program_id", student.program_id).maybeSingle();
    jobFitRoles = rule?.suggested_roles ?? [];
  }

  return (
    <div className="space-y-6">
      <Link href="/students" className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-accent">
        <span aria-hidden="true">&larr;</span> Return to Student Directory
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-brand">{student.full_name}</h1>
          <InclusionBadge disability={student.disability_status} refugee={student.refugee_status} />
          {isReadOnly && <span className="status-pill bg-ink/5 text-ink/50">Read-only view</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/60">
          <StatusBadge status={student.placement_status ?? "awaiting_placement"} />
          <span>{student.program_name ?? "No program on record"} {student.program_level ? `(${student.program_level})` : ""}</span>
          <span>·</span>
          <span>Graduated {student.graduation_date ? new Date(student.graduation_date).toLocaleDateString() : "—"}</span>
          {student.days_since_graduation !== null && student.placement_status !== "placed" && (
            <><span>·</span><span>{student.days_since_graduation} days since graduation</span></>
          )}
          {risk && risk.risk_flag !== "none" && (
            <><span>·</span><RiskBadge risk={risk.risk_flag} /></>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {placement && <PlacementForm placement={placement} canEdit={canEdit} />}
          <CvUpload studentId={params.id} documents={documents ?? []} />
          <CommentsSection studentId={params.id} comments={(comments ?? []) as any} canEdit={canEdit} />
          <ReadinessChecklist studentId={params.id} items={(readinessItems ?? []) as any} />
          <ActivityLog studentId={params.id} entries={(activityEntries ?? []) as any} canEdit={canEdit} />

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-brand">Status History</h2>
            <ul className="mt-3 space-y-2">
              {(history ?? []).map((h, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <StatusBadge status={h.status} />
                  <span className="text-ink/50">{new Date(h.changed_at).toLocaleString()}</span>
                </li>
              ))}
              {(!history || history.length === 0) && <li className="text-sm text-ink/40">No status changes recorded yet.</li>}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-brand">Program History</h2>
            <p className="text-xs text-accent">Every program this student has been enrolled in — the most recent is shown as their current one throughout the app.</p>
            <ul className="mt-3 divide-y divide-border">
              {programHistory.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">
                      {p.program_name ?? "Unspecified Program"} {p.program_level ? <span className="text-ink/50">({p.program_level})</span> : ""}
                    </p>
                    <p className="text-xs text-ink/50">{p.cohort_name ?? "Unspecified Cohort"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="status-pill bg-brand/10 text-brand">Current</span>}
                    <span className="text-xs text-ink/50">
                      {p.graduation_date ? new Date(p.graduation_date).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </li>
              ))}
              {programHistory.length === 0 && <li className="py-2 text-sm text-ink/40">No program enrollment on record.</li>}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-brand">Allocation History</h2>
            {allocationTrail && allocationTrail.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {allocationTrail.map((a: any) => (
                  <li key={a.allocation_id} className="border-l-2 border-border pl-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{a.staff_name ?? "Unknown staff"}</span>
                      <span className={`status-pill ${a.allocation_status === "active" ? "bg-success/10 text-success" : "bg-ink/5 text-ink/60"}`}>
                        {a.allocation_status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/50">
                      Assigned {new Date(a.assigned_at).toLocaleDateString()}
                      {a.assigned_by_name ? ` by ${a.assigned_by_name}` : ""} · Deadline {new Date(a.deadline).toLocaleDateString()}
                    </p>
                    {a.reason && <p className="mt-1 text-sm text-ink/70">&ldquo;{a.reason}&rdquo;</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-ink/40">Not currently allocated to a staff member.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <StudentDetailsForm
            studentId={params.id}
            canEdit={canEdit}
            details={{
              email: student.email, phone_number: student.phone_number, location: student.location,
              education_level: student.education_level, sponsorship_type: student.sponsorship_type,
              gender: student.gender, nationality: student.nationality, refugee_status: student.refugee_status,
              disability_status: student.disability_status, disability_type: student.disability_type
            }}
          />

          <SkillsetForm
            studentId={params.id}
            canEdit={canEdit}
            skillset={{
              technical_skills: student.technical_skills,
              technical_proficiency: student.technical_proficiency,
              career_track_interest: student.career_track_interest
            }}
          />

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-brand">Suggested Job Fit</h2>
            <p className="mt-1 text-xs text-ink/50">Based on program, level, and location</p>
            <JobFitSuggestion roles={jobFitRoles} />
          </div>
        </div>
      </div>
    </div>
  );
}