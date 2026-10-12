"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorPopup, { friendlyErrorMessage } from "@/components/ErrorPopup";
import AuthShell, { AuthButton, AuthField } from "@/components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(friendlyErrorMessage(error.message));
      return;
    }
    router.push("/students");
    router.refresh();
  }

  return (
    <>
      <AuthShell title="Sign in" subtitle="Welcome back. Use your Refactory staff account.">
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="Work email" icon="mail" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <AuthField label="Password" icon="lock" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            labelAside={<Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">Forgot your password?</Link>} />
          <div className="pt-1">
            <AuthButton loading={loading} loadingText="Signing in…">Sign in</AuthButton>
          </div>
        </form>
        <p className="mt-8 border-t border-border pt-5 text-xs text-ink/50">Accounts are created by a Super Admin in Supabase Auth.</p>
      </AuthShell>
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </>
  );
}
