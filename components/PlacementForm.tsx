"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorPopup, { friendlyErrorMessage } from "./ErrorPopup";
import { STATUS_LABELS } from "./StatusBadge";

type Placement = {
  id: string; status: string; company_name: string | null; position_title: string | null;
  employment_type: string | null; placement_date: string | null; salary_compensation: string | null;
  notes: string | null; needs_further_support?: boolean;
};

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "freelance", label: "Freelance / Gig Work" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "unpaid_internship", label: "Unpaid Internship (flag for support)" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "further_skilling", label: "Further Skilling" }
];

export default function PlacementForm({ placement, canEdit }: { placement: Placement; canEdit: boolean }) {
  const [form, setForm] = useState({ ...placement, needs_further_support: placement.needs_further_support ?? false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleEmploymentTypeChange(value: string) {
    setForm({
      ...form,
      employment_type: value,
      needs_further_support: value === "unpaid_internship" ? true : form.needs_further_support
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { data, error } = await supabase.from("placements").update({
      status: form.status, company_name: form.company_name, position_title: form.position_title,
      employment_type: form.employment_type, placement_date: form.placement_date,
      salary_compensation: form.salary_compensation, notes: form.notes,
      needs_further_support: form.needs_further_support
    }).eq("id", placement.id).select();
    setSaving(false);

    if (error) {
      setErrorPopup(friendlyErrorMessage(error.message));
      setForm({ ...placement, needs_further_support: placement.needs_further_support ?? false });
      return;
    }
    if (!data || data.length === 0) {
      setErrorPopup("You can't edit this student's placement — they're allocated to another staff member (or your account doesn't have edit access). Only their assigned officer or an Admin can make changes here.");
      setForm({ ...placement, needs_further_support: placement.needs_further_support ?? false });
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  if (!canEdit) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Placement & Employment</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Status" value={STATUS_LABELS[placement.status] ?? placement.status} />
          <Row label="Company" value={placement.company_name} />
          <Row label="Position title" value={placement.position_title} />
          <Row label="Employment type" value={EMPLOYMENT_TYPES.find((t) => t.value === placement.employment_type)?.label ?? placement.employment_type} />
          <Row label="Placement date" value={placement.placement_date} />
          <Row label="Salary / compensation" value={placement.salary_compensation} />
        </dl>
        <p className="mt-3 text-xs text-ink/40">Only this student's assigned officer or an Admin can edit placement details.</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Placement & Employment</h2>
        <div>
          <label className="block text-sm font-medium text-ink/80">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink/80">Company</label>
            <input value={form.company_name ?? ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">Position title</label>
            <input value={form.position_title ?? ""} onChange={(e) => setForm({ ...form, position_title: e.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">Employment type</label>
            <select value={form.employment_type ?? ""} onChange={(e) => handleEmploymentTypeChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
              <option value="">—</option>
              {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">Placement date</label>
            <input type="date" value={form.placement_date ?? ""} onChange={(e) => setForm({ ...form, placement_date: e.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-ink/80">Salary / compensation</label>
            <input value={form.salary_compensation ?? ""} onChange={(e) => setForm({ ...form, salary_compensation: e.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="needs_further_support" checked={form.needs_further_support}
              onChange={(e) => setForm({ ...form, needs_further_support: e.target.checked })}
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
            <label htmlFor="needs_further_support" className="text-sm text-ink/80">Flag as needing further support</label>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-ink/80">Notes</label>
            <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {message && <span className="text-sm text-ink/60">{message}</span>}
        </div>
      </form>
      {errorPopup && <ErrorPopup message={errorPopup} onClose={() => setErrorPopup(null)} />}
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink/50">{label}</dt><dd className="text-right font-medium">{value || "—"}</dd></div>;
}
