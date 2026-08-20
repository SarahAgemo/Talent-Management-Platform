"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, pageSize, totalCount }: { page: number; pageSize: number; totalCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/students?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-ink/50">Showing {start}–{end} of {totalCount}</p>
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
    </div>
  );
}
