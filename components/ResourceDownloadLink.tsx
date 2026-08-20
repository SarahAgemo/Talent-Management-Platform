"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResourceDownloadLink({ path, label }: { path: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function open() {
    setLoading(true);
    const { data, error } = await supabase.storage.from("resource-documents").createSignedUrl(path, 60);
    setLoading(false);
    if (error || !data) { alert(`Couldn't open file: ${error?.message}`); return; }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <button onClick={open} disabled={loading} title="Download" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline disabled:opacity-50">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {loading ? "Opening…" : label}
    </button>
  );
}
