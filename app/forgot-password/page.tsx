"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthShell, { AuthButton, AuthField } from "@/components/AuthShell";

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
    <AuthShell title="Reset your password" subtitle="Enter your work email and we'll send a reset link.">
      {status === "sent" ? (
        <div className="flex gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
          <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          <p>Check your email for a link to set a new password.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="Work email" icon="mail" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {status === "error" && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">Something went wrong — try again.</p>
          )}
          <AuthButton loading={loading} loadingText="Sending…">Send reset link</AuthButton>
        </form>
      )}
      <Link href="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
        <span aria-hidden>&larr;</span> Back to sign in
      </Link>
    </AuthShell>
  );
}
