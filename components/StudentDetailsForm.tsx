"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Details = {
  email: string | null; phone_number: string | null; location: string | null;
  education_level: string | null; sponsorship_type: string | null; gender: string | null;
  nationality: string | null; refugee_status: string | null; disability_status: string | null; disability_type: string | null;
};

export default function StudentDetailsForm({ studentId, details }: { studentId: string; details: Details }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(details);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("students").update(form).eq("id", studentId);
    setSaving(false);
    if (error) { setMessage(`Error: ${error.message}`); return; }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand">Student Details</h2>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-brand hover:underline">Edit</button>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Email" value={details.email} />
          <Row label="Phone" value={details.phone_number} />
          <Row label="Location" value={details.location} />
          <Row label="Education level" value={details.education_level} />
          <Row label="Sponsorship type" value={details.sponsorship_type} />
          <Row label="Gender" value={details.gender} />
          <Row label="Nationality" value={details.nationality} />
          <Row label="Refugee status" value={details.refugee_status} />
          <Row label="Disability status" value={details.disability_status} />
          {details.disability_status === "Yes" && <Row label="Type of disability" value={details.disability_type} />}
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-brand">Edit Student Details</h2>
      </div>
      <div className="mt-3 space-y-2">
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Field label="Education level" value={form.education_level} onChange={(v) => setForm({ ...form, education_level: v })} />
        <Field label="Sponsorship type" value={form.sponsorship_type} onChange={(v) => setForm({ ...form, sponsorship_type: v })} />
        <Field label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
        <Field label="Nationality" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
        <div>
          <label className="text-xs text-ink/50">Refugee status</label>
          <select value={form.refugee_status ?? ""} onChange={(e) => setForm({ ...form, refugee_status: e.target.value })}
            className="mt-0.5 w-full rounded-md border border-border px-2 py-1.5 text-sm">
            <option value="">—</option><option value="Yes">Yes</option><option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50">Disability status</label>
          <select value={form.disability_status ?? ""} onChange={(e) => setForm({ ...form, disability_status: e.target.value })}
            className="mt-0.5 w-full rounded-md border border-border px-2 py-1.5 text-sm">
            <option value="">—</option><option value="Yes">Yes</option><option value="No">No</option>
          </select>
        </div>
        {form.disability_status === "Yes" && (
          <Field label="Type of disability" value={form.disability_type} onChange={(v) => setForm({ ...form, disability_type: v })} />
        )}
      </div>
      {message && <p className="mt-2 text-sm text-danger">{message}</p>}
      <div className="mt-4 flex items-center gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => { setForm(details); setEditing(false); }} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink/50">{label}</dt><dd className="text-right font-medium">{value || "—"}</dd></div>;
}

function Field({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-ink/50">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-0.5 w-full rounded-md border border-border px-2 py-1.5 text-sm" />
    </div>
  );
}
