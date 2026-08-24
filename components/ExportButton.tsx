"use client";
import { useState } from "react";
import { exportToCSV, exportToXLSX } from "@/lib/exportUtils";

export default function ExportButton({ data, filename }: { data: Record<string, any>[]; filename: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-ink/5">
        Export ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border bg-surface shadow-lg">
            <button onClick={() => { exportToCSV(data, filename); setOpen(false); }}
              className="block w-full px-3 py-2 text-left text-sm text-ink/80 hover:bg-brand/10">
              Download CSV
            </button>
            <button onClick={() => { exportToXLSX(data, filename); setOpen(false); }}
              className="block w-full px-3 py-2 text-left text-sm text-ink/80 hover:bg-brand/10">
              Download Excel
            </button>
            <button onClick={() => { setOpen(false); window.print(); }}
              className="block w-full px-3 py-2 text-left text-sm text-ink/80 hover:bg-brand/10">
              Print / Save as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
