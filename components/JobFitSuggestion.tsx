export default function JobFitSuggestion({ roles }: { roles: string[] }) {
  if (!roles || roles.length === 0) return <p className="mt-2 text-sm text-ink/40">No job-fit rule on file yet for this program/level.</p>;
  return <div className="mt-2 flex flex-wrap gap-1.5">{roles.map((r) => <span key={r} className="status-pill bg-brand/10 text-brand">{r}</span>)}</div>;
}
