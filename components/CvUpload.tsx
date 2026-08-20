"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DocRow = { id: string; file_url: string; file_name: string | null; is_current: boolean; uploaded_at: string };

export default function CvUpload({ studentId, documents }: { studentId: string; documents: DocRow[] }) {
  const [uploading, setUploading] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false); const router = useRouter(); const supabase = createClient();
  const current = documents.find((d) => d.is_current) ?? documents[0];
  const older = documents.filter((d) => d.id !== current?.id);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setMessage(null);
    const path = `${studentId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("student-cvs").upload(path, file);
    if (uploadError) { setUploading(false); setMessage(`Upload failed: ${uploadError.message}`); return; }
    const { error: dbError } = await supabase.from("student_documents").insert({ student_id: studentId, file_url: path, file_name: file.name, is_current: true });
    setUploading(false);
    if (dbError) { setMessage(`Error saving record: ${dbError.message}`); return; }
    setMessage("CV uploaded."); router.refresh();
  }

  async function download(path: string) {
    const { data, error } = await supabase.storage.from("student-cvs").createSignedUrl(path, 60);
    if (error || !data) { setMessage(`Couldn't generate link: ${error?.message}`); return; }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-brand">CV</h2>
      {current ? (
        <div className="mt-3 flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
          <div><p className="font-medium">{current.file_name ?? "CV on file"}</p><p className="text-xs text-ink/50">Uploaded {new Date(current.uploaded_at).toLocaleDateString()}</p></div>
          <button onClick={() => download(current.file_url)} className="text-sm font-medium text-brand hover:underline">View / Download</button>
        </div>
      ) : <p className="mt-2 text-sm text-ink/40">No CV on file yet.</p>}
      <label className="mt-3 inline-block cursor-pointer text-sm font-medium text-brand hover:underline">
        {uploading ? "Uploading…" : current ? "Replace CV" : "Upload CV"}
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.doc,.docx" />
      </label>
      {message && <p className="mt-2 text-xs text-ink/60">{message}</p>}
      {older.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-ink/50 hover:text-ink/80">
            {showHistory ? "Hide" : "Show"} previous versions ({older.length})
          </button>
          {showHistory && (
            <ul className="mt-2 space-y-1">
              {older.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-xs text-ink/60">
                  <span>{d.file_name} — {new Date(d.uploaded_at).toLocaleDateString()}</span>
                  <button onClick={() => download(d.file_url)} className="text-brand hover:underline">Open</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
