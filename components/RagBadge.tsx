const STYLES: Record<string, string> = {
  red: "bg-danger/10 text-danger",
  amber: "bg-warning/10 text-warning",
  green: "bg-success/10 text-success"
};
const LABELS: Record<string, string> = { red: "Red", amber: "Amber", green: "Green" };

export function RagBadge({ status }: { status: string }) {
  return <span className={`status-pill ${STYLES[status] ?? "bg-ink/5 text-ink/60"}`}>{LABELS[status] ?? status}</span>;
}

export function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk || risk === "none") return <span className="text-ink/30">—</span>;
  if (risk === "red") return <span className="status-pill bg-danger/10 text-danger">🔴 At risk</span>;
  return <span className="status-pill bg-warning/10 text-warning">🟡 Watch</span>;
}

export function ReadinessBar({ green, amber, red }: { green: number; amber: number; red: number }) {
  const total = green + amber + red || 1;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink/5">
      <div style={{ width: `${(green / total) * 100}%` }} className="bg-success" />
      <div style={{ width: `${(amber / total) * 100}%` }} className="bg-warning" />
      <div style={{ width: `${(red / total) * 100}%` }} className="bg-danger" />
    </div>
  );
}
