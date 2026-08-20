"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_TYPES } from "./readinessItems";

type Entry = { id: string; activity_type: string; quantity: number; income_amount: number | null; notes: string | null; logged_at: string; staff_users: { name: string } | null };

export default function ActivityLog({ studentId, entries }: { studentId: string; entries: Entry[] }) {
  const [type, setType] = useState("application_submitted");
  const [quantity, setQuantity] = useState(1);
  const [income, setIncome] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("student_activity_log").insert({
      student_id: studentId, activity_type: type, quantity,
      income_amount: type === "paid_opportunity_generated" && income ? parseFloat(income) : null,
      notes: notes.trim() || null, logged_by: user?.id
    });
    setSaving(false);
    if (!error) { setQuantity(1); setIncome(""); setNotes(""); router.refresh(); }
  }

  const label = (key: string) => ACTIVITY_TYPES.find((a) => a.key === key)?.label ?? key;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-brand">Activity Log</h2>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm">
            {ACTIVITY_TYPES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-20 rounded-md border border-border px-3 py-1.5 text-sm" />
        </div>
        {type === "paid_opportunity_generated" && (
          <input type="number" placeholder="Income amount (optional)" value={income} onChange={(e) => setIncome(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-1.5 text-sm" />
        )}
        <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-1.5 text-sm" />
        <button type="submit" disabled={saving} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
          {saving ? "Logging…" : "Log activity"}
        </button>
      </form>

      <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto border-t border-border pt-3">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between text-sm">
            <span>{label(e.activity_type)}{e.quantity > 1 ? ` ×${e.quantity}` : ""}{e.notes ? ` — ${e.notes}` : ""}</span>
            <span className="whitespace-nowrap text-xs text-ink/40">{new Date(e.logged_at).toLocaleDateString()}</span>
          </li>
        ))}
        {entries.length === 0 && <li className="text-sm text-ink/40">No activity logged yet.</li>}
      </ul>
    </div>
  );
}
