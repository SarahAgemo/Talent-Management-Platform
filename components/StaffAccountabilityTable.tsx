"use client";
import ClientPaginator from "./ClientPaginator";

type StaffKpi = {
  staff_id: string;
  staff_name: string;
  total_placed: number;
  total_assigned: number;
  total_at_risk: number;
  avg_weeks_to_place: number | null;
};

export default function StaffAccountabilityTable({ staffKpis }: { staffKpis: StaffKpi[] }) {
  return (
    <ClientPaginator items={staffKpis}>
      {(pageItems) => (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Placed / Allocated</th>
                <th className="px-4 py-3">At Risk</th>
                <th className="px-4 py-3">Avg Weeks to Place</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.map((s) => (
                <tr key={s.staff_id} className="hover:bg-ink/[0.02]">
                  <td className="px-4 py-3 font-medium">{s.staff_name}</td>
                  <td className="px-4 py-3">{s.total_placed} / {s.total_assigned}</td>
                  <td className="px-4 py-3">
                    {s.total_at_risk > 0 ? <span className="status-pill bg-danger/10 text-danger">{s.total_at_risk}</span> : <span className="text-ink/30">0</span>}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{s.avg_weeks_to_place ?? "—"}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-ink/40">No staff accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ClientPaginator>
  );
}
