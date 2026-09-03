const STYLES: Record<string, string> = {
  red: "bg-danger/10 text-danger",
  amber: "bg-warning/10 text-warning",
  green: "bg-success/10 text-success"
};
const LABELS: Record<string, string> = { red: "Red", amber: "Amber", green: "Green" };

// A readiness color only means something for someone actively (or about
// to be) job-hunting. Once someone is Placed or Disinterested, the
// question "are your CV/LinkedIn/portfolio ready" no longer has a
// meaningful answer to chase — showing them as urgent red is a false
// alarm, not real signal. Further Skilling stays active, since they'll
// re-enter the job market later and genuinely will need this tracked.
export function RagBadge({ status, placementStatus }: { status: string; placementStatus?: string | null }) {
  if (placementStatus === "placed" || placementStatus === "declined_withdrawn") {
    return <span className="status-pill bg-ink/5 text-ink/40">Not tracked</span>;
  }
  return <span className={`status-pill ${STYLES[status] ?? "bg-ink/5 text-ink/60"}`}>{LABELS[status] ?? status}</span>;
}

export function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk || risk === "none") return <span className="text-ink/30">—</span>;
  if (risk === "red") return <span className="status-pill bg-danger/10 text-danger">🔴 At risk</span>;
  return <span className="status-pill bg-warning/10 text-warning">🟡 Watch</span>;
}

export function ReadinessBar({ green, amber, red, placementStatus }: { green: number; amber: number; red: number; placementStatus?: string | null }) {
  if (placementStatus === "placed" || placementStatus === "declined_withdrawn") {
    return <div className="h-2 w-full rounded-full bg-ink/5" title="Readiness no longer actively tracked" />;
  }
  const total = green + amber + red || 1;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink/5">
      <div style={{ width: `${(green / total) * 100}%` }} className="bg-success" />
      <div style={{ width: `${(amber / total) * 100}%` }} className="bg-warning" />
      <div style={{ width: `${(red / total) * 100}%` }} className="bg-danger" />
    </div>
  );
}