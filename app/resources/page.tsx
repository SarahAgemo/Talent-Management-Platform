export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import ResourceDocumentUpload from "@/components/ResourceDocumentUpload";
import DocumentsTable from "@/components/DocumentsTable";
import { JOB_BOARD_URL } from "@/lib/constants";

export default async function ResourcesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user ? await supabase.from("staff_users").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const isAdmin = me?.role === "super_admin" || me?.role === "placement_admin";

  const { data: documents } = await supabase.from("resource_documents").select("*").order("uploaded_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand">Resources Hub</h1>
          <p className="text-sm text-accent">CV templates, guides, and placement-support documents.</p>
        </div>
        <a href={JOB_BOARD_URL} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
          View Applicants on Job Board &rarr;
        </a>
      </div>
      <p className="text-xs text-ink/40">
        Job roles and applicant tracking now live on the external job board. The button above takes
        you there to see which of your talent have applied to which roles.
      </p>

      {isAdmin && <ResourceDocumentUpload />}

      <div>
        <h2 className="font-display text-lg font-semibold text-brand">Documents & Resources</h2>
        <p className="text-xs text-accent">The team's resource toolkit — CV templates, guides, and reference documents.</p>
        <div className="mt-3"><DocumentsTable documents={(documents ?? []) as any} /></div>
      </div>
    </div>
  );
}
