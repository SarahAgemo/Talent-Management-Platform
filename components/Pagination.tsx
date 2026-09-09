"use client";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = [10, 30, 50];

export default function Pagination({ page, pageSize, totalCount }: { page: number; pageSize: number; totalCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/students?${params.toString()}`);
  }

  function changePageSize(size: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(size));
    params.set("page", "1");
    router.push(`/students?${params.toString()}`);
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 text-ink/50">
        <span>Showing {totalCount === 0 ? 0 : start}–{end} of {totalCount}</span>
        <select value={pageSize} onChange={(e) => changePageSize(Number(e.target.value))} className="rounded-md border border-border px-2 py-1 text-xs">
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => goTo(page - 1)} disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1.5 font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-40">
            Previous
          </button>
          <span className="px-2 text-ink/60">Page {page} of {totalPages}</span>
          <button onClick={() => goTo(page + 1)} disabled={page >= totalPages}
            className="rounded-md border border-border px-3 py-1.5 font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}