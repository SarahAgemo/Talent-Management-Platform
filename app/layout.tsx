/*import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = { title: "Refactory Talent Placement Tracker", description: "Track graduates from Refactory Academy through to placement." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen bg-paper text-ink">
        <NavBar />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}*/

import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Refactory Talent Placement Tracker",
  description: "Track graduates from Refactory Academy through to placement."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = me?.role === "super_admin" || me?.role === "placement_admin";

  return (
    <html lang="en">
      <body className="font-body min-h-screen bg-paper text-ink">
        <NavBar isAdmin={isAdmin} />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
