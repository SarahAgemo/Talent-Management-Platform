"use client";
import { usePathname } from "next/navigation";

// Sign-in pages (login, forgot / reset password) use the full screen; every
// other page sits in the centred content column under the navigation bar.
const FULL_SCREEN_PAGES = ["/login", "/forgot-password", "/reset-password"];

export default function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = FULL_SCREEN_PAGES.some((p) => pathname?.startsWith(p));
  return <main className={fullScreen ? undefined : "mx-auto max-w-7xl px-6 py-8"}>{children}</main>;
}
