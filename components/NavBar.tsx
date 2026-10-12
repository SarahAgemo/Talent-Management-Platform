"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const ALL_LINKS = [
  { href: "/dashboard", label: "Dashboard", adminOnly: false },
  { href: "/my-caseload", label: "My Caseload", adminOnly: false },
  { href: "/students/upload", label: "Upload", adminOnly: true },
  { href: "/students", label: "Students", adminOnly: false },
  { href: "/allocations", label: "Allocations", adminOnly: false },
  { href: "/resources", label: "Resources", adminOnly: false }
];

export default function NavBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);

  if (pathname?.startsWith("/login") || pathname?.startsWith("/forgot-password") || pathname?.startsWith("/reset-password")) return null;

  const links = ALL_LINKS.filter((l) => !l.adminOnly || isAdmin);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:py-0">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-3 rounded-md" aria-label="Refactory Talent Tracker - go to the dashboard">
          <Logo className="h-7 w-auto" />
          <span aria-hidden className="hidden h-6 w-px bg-border xl:block" />
          <span className="hidden whitespace-nowrap font-display text-sm font-semibold text-ink/60 xl:block">Talent Tracker</span>
        </Link>

        <nav className="no-scrollbar order-last -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 py-0.5 lg:order-none lg:mx-0 lg:w-auto lg:min-w-0 lg:flex-1 lg:px-0">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/students" && pathname?.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
                className={clsx("whitespace-nowrap rounded-full px-3.5 py-1.5 font-display text-sm font-medium transition-colors",
                  active ? "bg-brand text-white" : "text-ink/70 hover:bg-brand/10 hover:text-brand")}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button onClick={signOut} disabled={signingOut} title="Sign out"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-ink/70 hover:border-danger/40 hover:bg-danger/10 hover:text-danger disabled:opacity-60 xl:px-3.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span className="sr-only xl:not-sr-only">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
