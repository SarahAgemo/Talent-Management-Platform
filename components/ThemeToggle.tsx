"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";

// Light / Dark / System switch. The choice is remembered in this browser
// (localStorage "theme"); "System" follows the computer's own setting.
// The startup script in app/layout.tsx applies the saved choice before the
// page paints, so there is no flash of the wrong theme on load.

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "theme";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

function readSavedTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage blocked (private mode etc.) - fall back to the system setting.
  }
  return "system";
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" }
];

export default function ThemeToggle({ className }: { className?: string }) {
  // null until mounted: the server can't know the saved choice, so nothing is
  // shown as selected until the browser has read it.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => { setTheme(readSavedTheme()); }, []);

  // While on "System", follow the computer switching between light and dark.
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    setTheme(next);
    try {
      if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved, but still applied for this visit.
    }
    applyTheme(next);
  }

  return (
    <div role="group" aria-label="Colour theme"
      className={clsx("inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5", className)}>
      {OPTIONS.map((o) => {
        const selected = theme === o.value;
        return (
          <button key={o.value} type="button" onClick={() => choose(o.value)}
            aria-pressed={selected} aria-label={`${o.label} theme`} title={`${o.label} theme`}
            className={clsx("flex h-7 w-7 items-center justify-center rounded-full",
              selected ? "bg-brand text-white" : "text-ink/50 hover:bg-ink/5 hover:text-ink")}>
            <ThemeIcon theme={o.value} />
          </button>
        );
      })}
    </div>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (theme === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
