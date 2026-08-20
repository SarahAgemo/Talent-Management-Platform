"use client";
import ClientPaginator from "./ClientPaginator";
import ResourceDownloadLink from "./ResourceDownloadLink";

type Doc = { id: string; title: string; category: string; uploaded_at: string; file_url: string };

export default function DocumentsTable({ documents }: { documents: Doc[] }) {
  return (
    <ClientPaginator items={documents}>
      {(pageItems) => (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand/10 text-xs uppercase tracking-wide text-brand">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Added</th><th className="px-4 py-3">File</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium">{d.title}</td>
                  <td className="px-4 py-3 text-ink/70">{d.category}</td>
                  <td className="px-4 py-3 text-ink/70">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><ResourceDownloadLink path={d.file_url} label="Download" /></td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-ink/40">No documents uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ClientPaginator>
  );
}
