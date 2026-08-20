"use client";
import { useState, useEffect } from "react";

export default function ClientPaginator<T>({
  items, pageSize = 10, children
}: { items: T[]; pageSize?: number; children: (pageItems: T[]) => React.ReactNode }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 if the underlying list shrinks below the current page
  // (e.g. a filter changes or data refreshes).
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return (
    <div>
      {children(pageItems)}
      {items.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <p className="text-ink/50">Showing {start + 1}–{Math.min(start + pageSize, items.length)} of {items.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="rounded-md border border-border px-3 py-1.5 font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-40">
              Previous
            </button>
            <span className="px-2 text-ink/60">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="rounded-md border border-border px-3 py-1.5 font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
