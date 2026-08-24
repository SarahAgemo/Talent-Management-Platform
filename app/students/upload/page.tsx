/*"use client";
import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

const EXPECTED_COLUMNS = [
  "Full Name", "Gender", "Nationality", "Refugee Status", "Disability status",
  "Type of Disability", "Youth (18-35)", "Email", "Phone Number", "Program Name",
  "Sponsorship Type", "Graduation Date", "Cohort", "Education Level",
  "Placement Status", "Company Name", "Position Title", "Placement Date", "Salary/Compensation"
];

const OPTIONAL_COLUMNS = [
  "Notes", "Technical Languages", "Technical Proficiency", "Career Track of Interest"
];

const BATCH_SIZE = 100; // rows per request — keeps each request well under serverless timeout limits

export default function UploadPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Progress + resumability state
  const [batchIndex, setBatchIndex] = useState(0); // next batch to send
  const [totals, setTotals] = useState({ inserted: 0, updated: 0, errors: [] as string[] });
  const [batchError, setBatchError] = useState<string | null>(null);

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE) || 1;
  const rowsDone = Math.min(batchIndex * BATCH_SIZE, rows.length);
  const isComplete = rows.length > 0 && batchIndex >= totalBatches;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data as any[]);
        resetProgress();
      }
    });
  }

  function resetProgress() {
    setBatchIndex(0);
    setTotals({ inserted: 0, updated: 0, errors: [] });
    setBatchError(null);
  }

  function handleCancel() {
    setRows([]);
    setFileName(null);
    resetProgress();
    setShowModal(false);
  }

  // Sends batches sequentially starting from whatever batchIndex currently is —
  // so calling this again after a failure resumes rather than restarting.
  async function runImport() {
    setSubmitting(true);
    setBatchError(null);
    let idx = batchIndex;
    let running = { ...totals };

    while (idx < totalBatches) {
      const start = idx * BATCH_SIZE;
      const batch = rows.slice(start, start + BATCH_SIZE);
      try {
        const res = await fetch("/api/students/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch })
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        running = {
          inserted: running.inserted + (data.inserted ?? 0),
          updated: running.updated + (data.updated ?? 0),
          errors: [...running.errors, ...(data.errors ?? [])]
        };
        idx += 1;
        setBatchIndex(idx);
        setTotals(running);
      } catch (err: any) {
        setBatchError(
          `Batch ${idx + 1} of ${totalBatches} failed (${err.message ?? "network error"}). ` +
          `Rows before this batch are already saved — click Resume once you're back online.`
        );
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setShowModal(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Bulk Upload</h1>
        <p className="text-sm text-accent">
          Upload a CSV of your tracking spreadsheet. Students matched by email are
          <strong> updated</strong> rather than duplicated — safe to re-upload or resume anytime.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="mb-2 text-sm font-medium text-ink/80">Expected columns</p>
        <p className="text-xs text-ink/50">{EXPECTED_COLUMNS.join(" · ")}</p>
        <p className="mt-3 mb-1 text-sm font-medium text-ink/80">Optional — auto-fills the Skillset section on the student profile</p>
        <p className="text-xs text-ink/50">{OPTIONAL_COLUMNS.join(" · ")}</p>
        <p className="mt-2 text-xs text-ink/40">
          Column order doesn't matter — headers are matched by name, not position. Large files are
          uploaded in batches of {BATCH_SIZE} rows automatically, so a dropped connection only
          costs you the current batch, not the whole file.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
        <input type="file" accept=".csv" onChange={handleFile} className="mx-auto text-sm" disabled={submitting} />
        {fileName && <p className="mt-2 text-sm text-ink/60">{rows.length} rows parsed from {fileName}</p>}
      </div>

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-brand/10">
                <tr>{Object.keys(rows[0]).slice(0, 6).map((k) => <th key={k} className="px-3 py-2 font-medium text-brand">{k}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>{Object.keys(rows[0]).slice(0, 6).map((k) => <td key={k} className="px-3 py-2 text-ink/70">{r[k]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/40">Showing first 5 rows / 6 columns as a preview.</p>

          {(submitting || batchIndex > 0) && !isComplete && (
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="flex items-center justify-between text-xs text-ink/60">
                <span>{rowsDone} / {rows.length} rows processed</span>
                <span>Batch {Math.min(batchIndex + 1, totalBatches)} of {totalBatches}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/5">
                <div className="h-full bg-brand transition-all" style={{ width: `${(rowsDone / rows.length) * 100}%` }} />
              </div>
            </div>
          )}

          {batchError && (
            <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {batchError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={runImport} disabled={submitting || isComplete}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
              {submitting
                ? "Uploading…"
                : batchError
                ? "Resume upload"
                : batchIndex > 0
                ? "Resume upload"
                : `Import ${rows.length} students`}
            </button>
            <button onClick={handleCancel} disabled={submitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0 }} className="z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="font-display text-lg font-semibold text-brand">Upload complete</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><strong className="text-success">{totals.inserted}</strong> new students added</li>
              <li><strong className="text-brand">{totals.updated}</strong> existing students updated (matched by email)</li>
              {totals.errors.length > 0 && <li><strong className="text-danger">{totals.errors.length}</strong> rows had errors — see below</li>}
            </ul>
            {totals.errors.length > 0 && (
              <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-danger">
                {totals.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink/50">
              New and updated students are now visible in the Student Directory.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={handleCancel}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">
                Upload another file
              </button>
              <Link href="/students"
                className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark">
                Go to Student Directory
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}*/

"use client";
import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

const EXPECTED_COLUMNS = [
  "Full Name", "Gender", "Nationality", "Refugee Status", "Disability status",
  "Type of Disability", "Youth (18-35)", "Email", "Phone Number", "Program Name",
  "Sponsorship Type", "Graduation Date", "Cohort", "Education Level",
  "Placement Status", "Company Name", "Position Title", "Placement Date", "Salary/Compensation"
];

const OPTIONAL_COLUMNS = [
  "Notes", "Technical Languages", "Technical Proficiency", "Career Track of Interest", "Assigned"
];

const BATCH_SIZE = 100;

export default function UploadPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [batchIndex, setBatchIndex] = useState(0);
  const [totals, setTotals] = useState({ inserted: 0, updated: 0, allocated: 0, errors: [] as string[] });
  const [batchError, setBatchError] = useState<string | null>(null);

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE) || 1;
  const rowsDone = Math.min(batchIndex * BATCH_SIZE, rows.length);
  const isComplete = rows.length > 0 && batchIndex >= totalBatches;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data as any[]);
        resetProgress();
        const fieldMismatches = (res.errors ?? []).filter((e) => e.type === "FieldMismatch");
        if (fieldMismatches.length > 0) {
          const rowNumbers = fieldMismatches.slice(0, 15).map((e) => (e.row ?? 0) + 2);
          setParseWarnings([
            `${fieldMismatches.length} row(s) have a different number of columns than the header row — ` +
            `this usually means a comma inside a text field (like Notes or Company Name) wasn't quoted in ` +
            `the source spreadsheet. Affected row(s) in the file: ${rowNumbers.join(", ")}${fieldMismatches.length > 15 ? "…" : ""}.`,
            `Fix: open the original file, find those rows, and make sure any text containing a comma is ` +
            `wrapped in quotes — then re-export and re-upload.`
          ]);
        } else {
          setParseWarnings([]);
        }
      }
    });
  }

  function resetProgress() {
    setBatchIndex(0);
    setTotals({ inserted: 0, updated: 0, allocated: 0, errors: [] });
    setBatchError(null);
    setAccessError(null);
  }

  function handleCancel() {
    setRows([]);
    setFileName(null);
    setParseWarnings([]);
    resetProgress();
    setShowModal(false);
  }

  async function runImport() {
    setSubmitting(true);
    setBatchError(null);
    setAccessError(null);
    let idx = batchIndex;
    let running = { ...totals };

    while (idx < totalBatches) {
      const start = idx * BATCH_SIZE;
      const batch = rows.slice(start, start + BATCH_SIZE);
      try {
        const res = await fetch("/api/students/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch })
        });
        if (res.status === 401 || res.status === 403) {
          const data = await res.json().catch(() => ({}));
          setAccessError(data.error || "You don't have permission to upload student data. Only Admins can do this.");
          setSubmitting(false);
          return;
        }
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        running = {
          inserted: running.inserted + (data.inserted ?? 0),
          updated: running.updated + (data.updated ?? 0),
          allocated: running.allocated + (data.allocated ?? 0),
          errors: [...running.errors, ...(data.errors ?? [])]
        };
        idx += 1;
        setBatchIndex(idx);
        setTotals(running);
      } catch (err: any) {
        setBatchError(
          `Batch ${idx + 1} of ${totalBatches} failed (${err.message ?? "network error"}). ` +
          `Rows before this batch are already saved — click Resume once you're back online.`
        );
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setShowModal(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand">Bulk Upload</h1>
        <p className="text-sm text-accent">
          Upload a CSV of your tracking spreadsheet. Students matched by email are
          <strong> updated</strong> rather than duplicated — safe to re-upload or resume anytime.
          This page is Admin-only.
        </p>
      </div>

      {accessError && (
        <div style={{ position: "fixed", inset: 0 }} className="z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center shadow-lg">
            <p className="text-3xl">🔒</p>
            <h2 className="mt-2 font-display text-lg font-semibold text-brand">Access restricted</h2>
            <p className="mt-2 text-sm text-ink/70">{accessError}</p>
            <button onClick={() => setAccessError(null)}
              className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
              Okay
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="mb-2 text-sm font-medium text-ink/80">Expected columns</p>
        <p className="text-xs text-ink/50">{EXPECTED_COLUMNS.join(" · ")}</p>
        <p className="mt-3 mb-1 text-sm font-medium text-ink/80">Optional</p>
        <p className="text-xs text-ink/50">{OPTIONAL_COLUMNS.join(" · ")}</p>
        <p className="mt-2 text-xs text-ink/40">
          "Assigned" pre-allocates a student to a staff member by name (matched against staff
          accounts) — only applied if that student isn't already allocated. Column order doesn't
          matter; large files upload in batches of {BATCH_SIZE} automatically.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
        <input type="file" accept=".csv" onChange={handleFile} className="mx-auto text-sm" disabled={submitting} />
        {fileName && <p className="mt-2 text-sm text-ink/60">{rows.length} rows parsed from {fileName}</p>}
      </div>

      {parseWarnings.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-ink/80">
          <p className="font-medium text-warning">Column alignment warning — check before importing</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-brand/10">
                <tr>{Object.keys(rows[0]).slice(0, 6).map((k) => <th key={k} className="px-3 py-2 font-medium text-brand">{k}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>{Object.keys(rows[0]).slice(0, 6).map((k) => <td key={k} className="px-3 py-2 text-ink/70">{r[k]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/40">Showing first 5 rows / 6 columns as a preview.</p>

          {(submitting || batchIndex > 0) && !isComplete && (
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="flex items-center justify-between text-xs text-ink/60">
                <span>{rowsDone} / {rows.length} rows processed</span>
                <span>Batch {Math.min(batchIndex + 1, totalBatches)} of {totalBatches}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/5">
                <div className="h-full bg-brand transition-all" style={{ width: `${(rowsDone / rows.length) * 100}%` }} />
              </div>
            </div>
          )}

          {batchError && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{batchError}</div>}

          <div className="flex items-center gap-3">
            <button onClick={runImport} disabled={submitting || isComplete}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60">
              {submitting ? "Uploading…" : batchError || batchIndex > 0 ? "Resume upload" : `Import ${rows.length} students`}
            </button>
            <button onClick={handleCancel} disabled={submitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0 }} className="z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="font-display text-lg font-semibold text-brand">Upload complete</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><strong className="text-success">{totals.inserted}</strong> new students added</li>
              <li><strong className="text-brand">{totals.updated}</strong> existing students updated (matched by email)</li>
              {totals.allocated > 0 && <li><strong className="text-accent">{totals.allocated}</strong> pre-allocated via the Assigned column</li>}
              {totals.errors.length > 0 && <li><strong className="text-danger">{totals.errors.length}</strong> rows had errors — see below</li>}
            </ul>
            {totals.errors.length > 0 && (
              <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-danger">
                {totals.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink/50">New and updated students are now visible in the Student Directory.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={handleCancel} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">
                Upload another file
              </button>
              <Link href="/students" className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark">
                Go to Student Directory
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
