import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AppMain from "@/components/AppMain";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Refactory Talent Placement Tracker",
  description: "Track graduates from Refactory Academy through to placement."
};

// Runs before the page paints: applies the saved theme (or the computer's
// setting when none is saved) so the page never flashes the wrong colours.
// It also switches to light colours while printing / saving as PDF, so dark
// mode never prints light text on white paper, then switches back.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}var w=false;window.addEventListener("beforeprint",function(){var r=document.documentElement;w=r.classList.contains("dark");if(w){r.classList.remove("dark");r.style.colorScheme="light";}});window.addEventListener("afterprint",function(){if(w){var r=document.documentElement;r.classList.add("dark");r.style.colorScheme="dark";w=false;}});})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = me?.role === "super_admin" || me?.role === "placement_admin";

  return (
    // suppressHydrationWarning: the theme script above sets the "dark" class on
    // <html> before React loads, which React would otherwise report as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-body min-h-screen bg-paper text-ink antialiased">
        <NavBar isAdmin={isAdmin} />
        <AppMain>{children}</AppMain>
      </body>
    </html>
  );
}
