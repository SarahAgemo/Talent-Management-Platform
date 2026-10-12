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
    <div style={{ position: "fixed", inset: 0, margin: 0 }} className="z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby="error-popup-title"
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </div>
        <h2 id="error-popup-title" className="mt-4 font-display text-lg font-semibold text-ink">Something didn&apos;t work</h2>
        <p className="mt-2 text-sm text-ink/70">{message}</p>
        <button onClick={onClose} autoFocus
          className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Okay
        </button>
      </div>
    </div>
  );
}
