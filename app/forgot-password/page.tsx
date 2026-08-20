"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setLoading(false);
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-brand">Reset your password</h1>
        <p className="mt-1 text-sm text-accent">Enter your work email and we'll send a reset link.</p>

        {status === "sent" ? (
          <p className="mt-6 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            Check your email for a link to set a new password.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink/80">Work email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
            </div>
            {status === "error" && <p className="text-sm text-danger">Something went wrong — try again.</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-4 inline-block text-xs text-accent hover:underline">&larr; Back to sign in</Link>
      </div>
    </div>
  );
}
