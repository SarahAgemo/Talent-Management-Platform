"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = { id: string; comment: string; created_at: string; staff_users: { name: string } | null };

export default function CommentsSection({ studentId, comments }: { studentId: string; comments: Comment[] }) {
  const [text, setText] = useState(""); const [saving, setSaving] = useState(false);
  const router = useRouter(); const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!text.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("student_comments").insert({ student_id: studentId, staff_id: user?.id, comment: text.trim() });
    setSaving(false);
    if (!error) { setText(""); router.refresh(); }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-brand">Progress Comments</h2>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Log a progress update…"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm" />
        <button type="submit" disabled={saving || !text.trim()} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50">Post</button>
      </form>
      <ul className="mt-4 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="border-l-2 border-border pl-3">
            <p className="text-sm">{c.comment}</p>
            <p className="mt-0.5 text-xs text-ink/40">{c.staff_users?.name ?? "Unknown"} · {new Date(c.created_at).toLocaleString()}</p>
          </li>
        ))}
        {comments.length === 0 && <li className="text-sm text-ink/40">No comments yet — be the first to log progress.</li>}
      </ul>
    </div>
  );
}
