"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorPopup, { friendlyErrorMessage } from "./ErrorPopup";

type Skillset = { technical_skills: string | null; technical_proficiency: string | null; career_track_interest: string | null };

export default function SkillsetForm({ studentId, skillset, canEdit }: { studentId: string; skillset: Skillset; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(skillset);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setForm(skillset);
  }, [skillset]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    const { data, error } = await supabase.from("students").update(form).eq("id", studentId).select();
    setSaving(false);

    if (error) {
      setErrorMessage(friendlyErrorMessage(error.message));
      setForm(skillset);
      return;
    }
    if (!data || data.length === 0) {
      setErrorMessage("You can't edit this student — they're allocated to another staff member (or your account doesn't have edit access). Only their assigned officer or an Admin can make changes here.");
      setForm(skillset);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand">Skillset</h2>
          {canEdit && <button onClick={() => setEditing(true)} className="text-xs font-medium text-accent hover:underline">Edit</button>}
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Technical skills" value={skillset.technical_skills} />
          <Row label="Proficiency" value={skillset.technical_proficiency} />
          <Row label="Career track interest" value={skillset.career_track_interest} />
        </dl>
        {!skillset.technical_skills && !skillset.technical_proficiency && (
          <p className="mt-2 text-xs text-ink/40">No skillset data on file for this student yet.{canEdit ? " Click Edit to add it." : ""}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-brand">Edit Skillset</h2>
        <div className="mt-3 space-y-2">
          <div>
            <label className="text-xs text-ink/50">Technical skills (comma-separated)</label>
            <input value={form.technical_skills ?? ""} onChange={(e) => setForm({ ...form, technical_skills: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-border px-2 py-1.5 text-sm" placeholder="e.g. Python, SQL, React" />
          </div>
          <div>
            <label className="text-xs text-ink/50">Proficiency</label>
            <select value={form.technical_proficiency ?? ""} onChange={(e) => setForm({ ...form, technical_proficiency: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-border px-2 py-1.5 text-sm">
              <option value="">—</option><option value="Beginner">Beginner</option><option value="Junior">Junior</option>
              <option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-ink/50">Career track interest</label>
            <input value={form.career_track_interest ?? ""} onChange={(e) => setForm({ ...form, career_track_interest: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-border px-2 py-1.5 text-sm" placeholder="e.g. Backend Developer" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="submit" disabled={saving} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => { setForm(skillset); setEditing(false); }} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5">
            Cancel
          </button>
        </div>
      </form>
      {errorMessage && <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />}
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink/50">{label}</dt><dd className="text-right font-medium">{value || "—"}</dd></div>;
}