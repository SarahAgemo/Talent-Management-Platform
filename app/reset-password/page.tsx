"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthShell, { AuthButton, AuthField } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => { router.push("/students"); router.refresh(); }, 1500);
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account — at least 8 characters.">
      {done ? (
        <div className="flex gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
          <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          <p>Password updated — redirecting…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="New password" icon="lock" type="password" required autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <AuthField label="Confirm password" icon="lock" type="password" required autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <AuthButton loading={loading} loadingText="Saving…">Update password</AuthButton>
        </form>
      )}
    </AuthShell>
  );
}
