"use client";
import { useState, useEffect } from "react";

const PAGE_SIZE_OPTIONS = [10, 30, 50];

export default function ClientPaginator<T>({
  items, pageSize: initialPageSize = 10, children
}: { items: T[]; pageSize?: number; children: (pageItems: T[]) => React.ReactNode }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return (
    <div>
      {children(pageItems)}
      {items.length > PAGE_SIZE_OPTIONS[0] && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-ink/50">
            <span>Showing {start + 1}–{Math.min(start + pageSize, items.length)} of {items.length}</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          {totalPages > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
}