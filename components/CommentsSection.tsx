"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorPopup, { friendlyErrorMessage } from "./ErrorPopup";

type Comment = { id: string; comment: string; created_at: string; staff_users: { name: string } | null };

const QUICK_REASONS = [
  "Unreachable / offline",
  "No devices - phone/pc",
  "Not interested in work",
  "Other"
];

export default function CommentsSection({ studentId, comments, canEdit }: { studentId: string; comments: Comment[]; canEdit: boolean }) {
  const [reason, setReason] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleReasonChange(value: string) {
    setReason(value);
    if (value && value !== "Other") setText(value);
    else if (value === "Other") setText("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setErrorMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("student_comments").insert({ student_id: studentId, staff_id: user?.id, comment: text.trim() }).select();
    setSaving(false);

    if (error) { setErrorMessage(friendlyErrorMessage(error.message)); return; }
    if (!data || data.length === 0) {
      setErrorMessage("You can't comment on this student — they're allocated to another staff member (or your account doesn't have edit access).");
      return;
    }
    setText("");
    setReason("");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-brand">Progress Comments</h2>

      {canEdit ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <select value={reason} onChange={(e) => handleReasonChange(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm">
            <option value="">Quick reason (optional)…</option>
            {QUICK_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Log a progress update…"
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm" />
            <button type="submit" disabled={saving || !text.trim()}
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50">
              Post
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 text-xs text-ink/40">Only this student's assigned officer or an Admin can add comments here.</p>
      )}

      <ul className="mt-4 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="border-l-2 border-border pl-3">
            <p className="text-sm">{c.comment}</p>
            <p className="mt-0.5 text-xs text-ink/40">{c.staff_users?.name ?? "Unknown"} · {new Date(c.created_at).toLocaleString()}</p>
          </li>
        ))}
        {comments.length === 0 && <li className="text-sm text-ink/40">No comments yet — be the first to log progress.</li>}
      </ul>

      {errorMessage && <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />}
    </div>
  );
}