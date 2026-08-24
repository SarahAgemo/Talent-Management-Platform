"use client";

// Translates raw Supabase/Postgres error text into something a non-technical
// person can actually act on. Falls back to a generic friendly message for
// anything not recognized, rather than ever showing raw error internals.
export function friendlyErrorMessage(raw: string | undefined | null): string {
  const v = (raw ?? "").toLowerCase();

  if (v.includes("invalid login credentials")) {
    return "That email or password isn't right. Double-check and try again.";
  }
  if (v.includes("email not confirmed")) {
    return "This account's email hasn't been confirmed yet — check for a confirmation email, or ask an Admin.";
  }
  if (v.includes("row-level security") || v.includes("row level security") || v.includes("permission denied")) {
    return "You don't have permission to do that. If this seems wrong, check with an Admin.";
  }
  if (v.includes("duplicate key") || v.includes("already exists")) {
    return "That record already exists — no changes were made.";
  }
  if (v.includes("network") || v.includes("failed to fetch")) {
    return "Couldn't reach the server — check your internet connection and try again.";
  }
  if (v.includes("jwt") || v.includes("session") || v.includes("not authenticated")) {
    return "Your session may have expired — try signing out and back in.";
  }
  if (!raw) return "Something went wrong. Please try again.";
  return "Something went wrong on that action. Please try again, or check with an Admin if it keeps happening.";
}

export default function ErrorPopup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0 }} className="z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center shadow-lg">
        <p className="text-3xl">⚠️</p>
        <h2 className="mt-2 font-display text-lg font-semibold text-brand">Something didn't work</h2>
        <p className="mt-2 text-sm text-ink/70">{message}</p>
        <button onClick={onClose} className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
          Okay
        </button>
      </div>
    </div>
  );
}
