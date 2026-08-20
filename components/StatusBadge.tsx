const STATUS_STYLES: Record<string, string> = {
  awaiting_placement: "bg-ink/5 text-ink/70",
  in_preparation: "bg-accent-light/50 text-accent",
  applying: "bg-blue-50 text-blue-700",
  interviewing: "bg-warning/10 text-warning",
  offer_extended: "bg-brand/10 text-brand",
  placed: "bg-success/10 text-success",
  declined_withdrawn: "bg-danger/10 text-danger",
  further_skilling: "bg-purple-50 text-purple-700"
};

export const STATUS_LABELS: Record<string, string> = {
  awaiting_placement: "Available for Work",
  in_preparation: "In Preparation",
  applying: "Applying",
  interviewing: "Interviewing",
  offer_extended: "Offer Extended",
  placed: "Placed",
  declined_withdrawn: "Declined / Withdrawn",
  further_skilling: "Further Skilling"
};
export default function StatusBadge({ status }: { status: string }) {
  return <span className={`status-pill ${STATUS_STYLES[status] ?? "bg-ink/5 text-ink/70"}`}>{STATUS_LABELS[status] ?? status}</span>;
}
export function InclusionBadge({ disability, refugee }: { disability?: string | null; refugee?: string | null }) {
  const isDisability = disability === "Yes"; const isRefugee = refugee === "Yes";
  if (!isDisability && !isRefugee) return null;
  return (
    <span className="inline-flex gap-1">
      {isDisability && <span className="status-pill bg-purple-50 text-purple-700" title="Disability status on file">Disability</span>}
      {isRefugee && <span className="status-pill bg-pink-50 text-pink-700" title="Refugee status on file">Refugee</span>}
    </span>
  );
}
