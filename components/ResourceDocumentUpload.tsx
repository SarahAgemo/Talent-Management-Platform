"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResourceDocumentUpload() {
  const [title, setTitle] = useState(""); const [category, setCategory] = useState("CV Template");
  const [uploading, setUploading] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const router = useRouter(); const supabase = createClient();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const fileInput = document.getElementById("resource-file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file || !title.trim()) { setMessage("Add a title and choose a file."); return; }
    setUploading(true); setMessage(null);
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resource-documents").upload(path, file);
    if (uploadError) { setUploading(false); setMessage(`Upload failed: ${uploadError.message}`); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error: dbError } = await supabase.from("resource_documents").insert({ title: title.trim(), category, file_url: path, uploaded_by: user?.id });
    setUploading(false);
    if (dbError) { setMessage(`Error: ${dbError.message}`); return; }
    setMessage("Uploaded."); setTitle(""); if (fileInput) fileInput.value = ""; router.refresh();
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3 rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-brand">Add a resource document</h2>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Title (e.g. Junior Dev CV Template)" value={title} onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
          <option>CV Template</option><option>Interview Guide</option><option>Cover Letter Template</option><option>General</option>
        </select>
      </div>
      <input id="resource-file" type="file" className="text-sm" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={uploading} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {message && <span className="text-sm text-ink/60">{message}</span>}
      </div>
    </form>
  );
}
