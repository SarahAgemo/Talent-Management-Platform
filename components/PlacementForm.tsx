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
  employment_category?: string | null; improvement_type?: string | null; improvement_other_detail?: string | null;
  youth_employed_count?: number | null;
  employees_female?: number | null; employees_male?: number | null;
  employees_below_18?: number | null; employees_18_35?: number | null; employees_above_35?: number | null;
  employees_ugandan?: number | null; employees_non_ugandan?: number | null;
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

const EMPLOYMENT_CATEGORIES = [
  { value: "new_employment", label: "New Employment" },
  { value: "improved_employment", label: "Improved Employment" }
];

const IMPROVEMENT_TYPES = [
  { value: "income_increase", label: "Income Increase" },
  { value: "improved_working_conditions", label: "Improved Working Conditions" },
  { value: "other", label: "Other" }
];

const SELF_EMPLOYMENT_KEYS = [
  "youth_employed_count", "employees_female", "employees_male",
  "employees_below_18", "employees_18_35", "employees_above_35",
  "employees_ugandan", "employees_non_ugandan"
] as const;

function numToStr(n: number | null | undefined) { return n === null || n === undefined ? "" : String(n); }
function strToInt(v: string): number | null {
  const n = parseInt(v, 10);
  return isNaN(n) || n < 0 ? null : n;
}

function initialForm(p: Placement) {
  return {
    ...p,
    needs_further_support: p.needs_further_support ?? false,
    employment_category: p.employment_category ?? "",
    improvement_type: p.improvement_type ?? "",
    improvement_other_detail: p.improvement_other_detail ?? "",
    youth_employed_count: numToStr(p.youth_employed_count),
    employees_female: numToStr(p.employees_female),
    employees_male: numToStr(p.employees_male),
    employees_below_18: numToStr(p.employees_below_18),
    employees_18_35: numToStr(p.employees_18_35),
    employees_above_35: numToStr(p.employees_above_35),
    employees_ugandan: numToStr(p.employees_ugandan),
    employees_non_ugandan: numToStr(p.employees_non_ugandan)
  };
}

export default function PlacementForm({ placement, canEdit }: { placement: Placement; canEdit: boolean }) {
  const [form, setForm] = useState(initialForm(placement));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isSelfEmployed = form.employment_type === "self_employed";

  function handleEmploymentTypeChange(value: string) {
    setForm({
      ...form,
      employment_type: value,
      needs_further_support: value === "unpaid_internship" ? true : form.needs_further_support
    });
  }

  function handleCategoryChange(value: string) {
    setForm({
      ...form,
      employment_category: value,
      improvement_type: value === "improved_employment" ? form.improvement_type : "",
      improvement_other_detail: value === "improved_employment" ? form.improvement_other_detail : ""
    });
  }

  function handleImprovementTypeChange(value: string) {
    setForm({
      ...form,
      improvement_type: value,
      improvement_other_detail: value === "other" ? form.improvement_other_detail : ""
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Self-employment numbers are only stored while the type is actually
    // Self-Employed — switching to any other type clears them on save, so
    // stale business figures can't linger on a full-time placement.
    const selfEmploymentPayload: Record<string, number | null> = {};
    for (const key of SELF_EMPLOYMENT_KEYS) {
      selfEmploymentPayload[key] = isSelfEmployed ? strToInt(form[key]) : null;
    }

    const { data, error } = await supabase.from("placements").update({
      status: form.status, company_name: form.company_name, position_title: form.position_title,
      employment_type: form.employment_type,
      placement_date: form.placement_date || null,
      salary_compensation: form.salary_compensation, notes: form.notes,
      needs_further_support: form.needs_further_support,
      employment_category: form.employment_category || null,
      improvement_type: form.employment_category === "improved_employment" ? (form.improvement_type || null) : null,
      improvement_other_detail: form.improvement_type === "other" ? (form.improvement_other_detail || null) : null,
      ...selfEmploymentPayload
    }).eq("id", placement.id).select();
    setSaving(false);

    if (error) {
      setErrorPopup(friendlyErrorMessage(error.message));
      setForm(initialForm(placement));
      return;
    }
    if (!data || data.length === 0) {
      setErrorPopup("You can't edit this student's placement — they're allocated to another staff member (or your account doesn't have edit access). Only their assigned officer or an Admin can make changes here.");
      setForm(initialForm(placement));
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
          {placement.employment_type === "self_employed" && (
            <>
              <Row label="Youth employed in business" value={numToStr(placement.youth_employed_count)} />
              <Row label="Female / Male" value={`${numToStr(placement.employees_female) || "—"} / ${numToStr(placement.employees_male) || "—"}`} />
              <Row label="Below 18 / 18–35 / Above 35" value={`${numToStr(placement.employees_below_18) || "—"} / ${numToStr(placement.employees_18_35) || "—"} / ${numToStr(placement.employees_above_35) || "—"}`} />
              <Row label="Ugandan / Non-Ugandan" value={`${numToStr(placement.employees_ugandan) || "—"} / ${numToStr(placement.employees_non_ugandan) || "—"}`} />
            </>
          )}
          <Row label="Employment category" value={EMPLOYMENT_CATEGORIES.find((c) => c.value === placement.employment_category)?.label} />
          {placement.employment_category === "improved_employment" && (
            <Row label="What improved" value={
              placement.improvement_type === "other"
                ? placement.improvement_other_detail
                : IMPROVEMENT_TYPES.find((i) => i.value === placement.improvement_type)?.label
            } />
          )}
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
            <label className="block text-sm font-medium text-ink/80">Employment category</label>
            <select value={form.employment_category} onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
              <option value="">—</option>
              {EMPLOYMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {isSelfEmployed && (
            <div className="col-span-2 rounded-md border border-brand/20 bg-brand/5 p-4">
              <p className="text-sm font-medium text-brand">Self-employment — business details</p>
              <div className="mt-3">
                <NumberField label="Number of youth employed in business" value={form.youth_employed_count}
                  onChange={(v) => setForm({ ...form, youth_employed_count: v })} />
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">Gender</p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <NumberField label="No. of female" value={form.employees_female} onChange={(v) => setForm({ ...form, employees_female: v })} />
                <NumberField label="No. of male" value={form.employees_male} onChange={(v) => setForm({ ...form, employees_male: v })} />
              </div>
              <SumCheck parts={[form.employees_female, form.employees_male]} total={form.youth_employed_count} label="Female + Male" />

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">Age group</p>
              <div className="mt-1 grid grid-cols-3 gap-3">
                <NumberField label="Below 18" value={form.employees_below_18} onChange={(v) => setForm({ ...form, employees_below_18: v })} />
                <NumberField label="18–35" value={form.employees_18_35} onChange={(v) => setForm({ ...form, employees_18_35: v })} />
                <NumberField label="Above 35" value={form.employees_above_35} onChange={(v) => setForm({ ...form, employees_above_35: v })} />
              </div>
              <SumCheck parts={[form.employees_below_18, form.employees_18_35, form.employees_above_35]} total={form.youth_employed_count} label="Age groups" />

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">Nationality</p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <NumberField label="No. of Ugandans" value={form.employees_ugandan} onChange={(v) => setForm({ ...form, employees_ugandan: v })} />
                <NumberField label="No. of non-Ugandans" value={form.employees_non_ugandan} onChange={(v) => setForm({ ...form, employees_non_ugandan: v })} />
              </div>
              <SumCheck parts={[form.employees_ugandan, form.employees_non_ugandan]} total={form.youth_employed_count} label="Ugandan + Non-Ugandan" />
            </div>
          )}

          {form.employment_category === "improved_employment" && (
            <div>
              <label className="block text-sm font-medium text-ink/80">If improved, what improved?</label>
              <select value={form.improvement_type} onChange={(e) => handleImprovementTypeChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="">—</option>
                {IMPROVEMENT_TYPES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          )}

          {form.employment_category === "improved_employment" && form.improvement_type === "other" && (
            <div>
              <label className="block text-sm font-medium text-ink/80">Please specify</label>
              <input value={form.improvement_other_detail} onChange={(e) => setForm({ ...form, improvement_other_detail: e.target.value })}
                placeholder="Describe what improved…"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink/80">Placement date</label>
            <input type="date" value={form.placement_date ?? ""} onChange={(e) => setForm({ ...form, placement_date: e.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-ink/40">Clear this field to remove the date entirely.</p>
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

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-ink/60">{label}</label>
      <input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm" />
    </div>
  );
}

// Non-blocking check: flags when a breakdown doesn't add up to the total,
// so mismatched figures get noticed at entry time rather than in a report.
function SumCheck({ parts, total, label }: { parts: string[]; total: string; label: string }) {
  const totalNum = strToInt(total);
  const filled = parts.filter((p) => p !== "");
  if (totalNum === null || filled.length === 0) return null;
  const sum = parts.reduce((acc, p) => acc + (strToInt(p) ?? 0), 0);
  if (sum === totalNum) return null;
  return <p className="mt-1 text-xs text-warning">{label} = {sum}, which doesn't match the total of {totalNum}.</p>;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink/50">{label}</dt><dd className="text-right font-medium">{value || "—"}</dd></div>;
}
