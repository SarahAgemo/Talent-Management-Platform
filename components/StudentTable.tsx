import Link from "next/link";
import StatusBadge, { InclusionBadge } from "./StatusBadge";
import clsx from "clsx";

export type StudentRow = {
  student_id: string; full_name: string; program_name: string | null; cohort_name: string | null;
  graduation_date: string | null; placement_status: string | null; company_name: string | null;
  days_since_graduation: number | null; disability_status?: string | null; refugee_status?: string | null;
  assigned_staff_name?: string | null;
};

export default function StudentTable({ rows }: { rows: StudentRow[] }) {
  if (rows.length === 0) {
    return <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-ink/50">No students match these filters.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
          <tr>
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Program</th><th className="px-4 py-3">Cohort</th>
            <th className="px-4 py-3">Graduated</th><th className="px-4 py-3">Days out</th><th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Company</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Inclusion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.student_id} className="hover:bg-ink/[0.02]">
              <td className="px-4 py-3 font-medium">
                <Link href={`/students/${r.student_id}`} title="View profile" className="text-ink transition-colors hover:text-accent hover:underline">
                  {r.full_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{r.program_name ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{r.cohort_name ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{r.graduation_date ? new Date(r.graduation_date).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3">
                {r.placement_status !== "placed" && r.days_since_graduation !== null ? (
                  <span className={clsx("font-medium", r.days_since_graduation > 90 ? "text-danger" : r.days_since_graduation > 60 ? "text-warning" : "text-ink/70")}>
                    {r.days_since_graduation}d
                  </span>
                ) : <span className="text-ink/40">—</span>}
              </td>
              <td className="px-4 py-3"><StatusBadge status={r.placement_status ?? "awaiting_placement"} /></td>
              <td className="px-4 py-3 text-ink/70">{r.company_name ?? "—"}</td>
              <td className="px-4 py-3">
                {r.assigned_staff_name ? (
                  <span className="status-pill bg-brand/10 text-brand">{r.assigned_staff_name}</span>
                ) : (
                  <span className="status-pill bg-ink/5 text-ink/50">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3"><InclusionBadge disability={r.disability_status} refugee={r.refugee_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
