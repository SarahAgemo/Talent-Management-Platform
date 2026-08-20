"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-caseload", label: "My Caseload" },
  { href: "/students/upload", label: "Upload" },
  { href: "/students", label: "Students" },
  { href: "/allocations", label: "Allocations" },
  { href: "/resources", label: "Resources" }
];

export default function NavBar() {
  const pathname = usePathname(); const router = useRouter(); const supabase = createClient();
  if (pathname?.startsWith("/login") || pathname?.startsWith("/forgot-password") || pathname?.startsWith("/reset-password")) return null;

  async function signOut() { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-display text-lg font-semibold text-brand">Refactory Talent Tracker</span>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                className={clsx("rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === link.href || (link.href !== "/students" && pathname?.startsWith(link.href))
                    ? "bg-brand text-white" : "text-ink/70 hover:bg-accent/10 hover:text-accent")}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={signOut} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5">Sign out</button>
      </div>
    </header>
  );
}
