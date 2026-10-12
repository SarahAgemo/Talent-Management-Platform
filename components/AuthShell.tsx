"use client";
import { useId, useState } from "react";
import clsx from "clsx";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

// Shared layout for the sign-in, forgot-password and reset-password pages:
// a Refactory purple brand panel on the left (large screens) and the form on
// the right. On phones the panel is hidden and the logo sits above the form.

const FEATURES = [
  "Caseloads and allocations for every placement officer",
  "Readiness, applications and interviews in one record",
  "Live dashboards on placement outcomes"
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[46%] max-w-[640px] flex-col overflow-hidden text-white lg:flex"
        style={{ background: "linear-gradient(155deg, #73407A 0%, #663367 42%, #4E264F 100%)" }}>
        {/* Decoration only: soft light glows, a fine dot grid and two faint rings. */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(560px 440px at 100% 100%, rgba(166,106,169,0.45), transparent 70%), radial-gradient(480px 360px at 0% 0%, rgba(255,255,255,0.10), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(#FFFFFF 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10" />

        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-14">
          <Logo variant="white" className="h-10 w-auto self-start" />

          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-[#38BFC3]">Talent Placement Tracker</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight xl:text-[2.75rem]">Advancing Uganda&rsquo;s Tech Industry</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
              Follow every Refactory participant from graduation to their first job, all in one place.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#38BFC3] ring-1 ring-white/15">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/50">Refactory Academy &middot; Staff access only</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Logo className="h-7 w-auto lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-8 sm:items-center sm:px-10 sm:pt-4">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
            <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

type AuthFieldProps = {
  label: string;
  icon: "mail" | "lock";
  labelAside?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

// Labelled input with a leading icon. Password fields get a show / hide button.
export function AuthField({ label, icon, labelAside, type = "text", ...input }: AuthFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-ink/80">{label}</label>
        {labelAside}
      </div>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-ink/40">
          {icon === "mail" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
        </span>
        <input id={id} type={isPassword && visible ? "text" : type} {...input}
          className={clsx("block h-11 w-full rounded-lg border border-border pl-10 text-sm text-ink shadow-sm",
            "placeholder:text-ink/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
            isPassword ? "pr-11" : "pr-3")} />
        {isPassword && (
          <button type="button" onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink/40 hover:text-ink/70">
            {visible ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Full-width purple submit button with a spinner while working.
export function AuthButton({ loading, loadingText, children }: { loading: boolean; loadingText: string; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70">
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {loading ? loadingText : children}
    </button>
  );
}
