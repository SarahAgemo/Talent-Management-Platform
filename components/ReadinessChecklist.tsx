"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";
import { READINESS_ITEMS, FLOWMINGO_URL } from "./readinessItems";

type Item = { item_key: string; status: string; flowmingo_used: boolean };

export default function ReadinessChecklist({ studentId, items }: { studentId: string; items: Item[] }) {
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function itemFor(key: string) {
    return items.find((i) => i.item_key === key) ?? { item_key: key, status: "red", flowmingo_used: false };
  }

  async function setStatus(key: string, status: string) {
    setSaving(key);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("readiness_checklist").upsert(
      { student_id: studentId, item_key: key, status, updated_by: user?.id },
      { onConflict: "student_id,item_key" }
    );
    setSaving(null);
    router.refresh();
  }

  async function toggleFlowmingo(key: string, current: boolean) {
    setSaving(key);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("readiness_checklist").upsert(
      { student_id: studentId, item_key: key, status: itemFor(key).status, flowmingo_used: !current, updated_by: user?.id },
      { onConflict: "student_id,item_key" }
    );
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-brand">Readiness Checklist</h2>
      <ul className="mt-3 divide-y divide-border">
        {READINESS_ITEMS.map(({ key, label }) => {
          const item = itemFor(key);
          const showFlowmingo = key === "cv" || key === "mock_interview";
          return (
            <li key={key} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm">{label}</p>
                {showFlowmingo && (
                  <label className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
                    <input type="checkbox" checked={item.flowmingo_used} onChange={() => toggleFlowmingo(key, item.flowmingo_used)}
                      className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent" />
                    Used <a href={FLOWMINGO_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Flowmingo</a>
                  </label>
                )}
              </div>
              <div className="flex gap-1">
                {(["red", "amber", "green"] as const).map((s) => (
                  <button key={s} onClick={() => setStatus(key, s)} disabled={saving === key}
                    className={clsx("h-5 w-5 rounded-full border-2 transition-transform",
                      item.status === s ? "scale-110 border-ink/30" : "border-transparent opacity-40 hover:opacity-70",
                      s === "red" && "bg-danger", s === "amber" && "bg-warning", s === "green" && "bg-success"
                    )}
                    title={s} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
