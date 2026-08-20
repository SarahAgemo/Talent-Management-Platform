# v3 Rollout Guide

Run order for a brand-new setup: `schema.sql` → `migration_002_talent_features.sql` →
`migration_003_ui_enhancements.sql`, then Storage setup, then the app.

If you already have schema.sql and migration_002 applied (as you do), **you only need to run
`migration_003_ui_enhancements.sql`** — everything in it is additive against what you already have.

## What's new in this round

**Students Directory**
- Paginated to 10 students per page, with Previous/Next and a count of total results.
- Student names now show an explicit "View profile" hover state.
- An explicit **Search** button next to the search field (Enter still works too).

**Student Profile**
- "Return to Student Directory" link at the top.
- New **Location** field, and a **Skillset** panel (Technical skills, Proficiency, Career track
  interest) — these are new columns on `students`, populated manually for now (edit directly in
  Supabase's Table Editor, or via a future bulk-import from your skillset spreadsheet).
- Disability *type* now shows alongside disability status, when applicable.

**Upload Page**
- A confirmation modal after import: how many new vs updated, any row errors, and a reminder that
  results are visible in the Student Directory.
- A **Cancel** button next to Import, to back out before committing.
- Clarified messaging: there's no "skipped duplicates" concept currently — matching students are
  *updated*, not skipped, so nothing from a re-upload is silently dropped.

**Allocations**
- The allocation modal no longer hides staff — it always shows everyone, with an informational
  note (not a filter) when the student needs inclusion support.
- "Currently Allocated" is now a single flat table (not grouped by staff) with Name, Program,
  Status, Inclusion, Due Date, **First Allocated To**, Currently Assigned To, and a Reallocate
  button per row. "First Allocated To" is tracked automatically now — set once when an allocation
  is created and never overwritten by later reallocations.

**Resources Hub**
- Job postings now show as real tables (Role, Company, Location, Due date, Applicants, Link) for
  both Open and Archived, instead of cards.
- The post-opportunity form has a new **Application link** field.
- Documents table has a Download column (signed link, generated on click — the bucket stays
  private, nothing is ever public).

**Dashboard**
- Placed vs Remaining chart has a granularity dropdown: Day / Week / Month / Year.
- Placement Rate by Program now shows placed/total counts underneath the percentage chart, not
  just percentages.
- New chart: **Top 10 Job Titles by Placements** — a straightforward count of which specific
  roles students have actually landed most often.

## Schema changes in migration_003 (for reference)
- `students`: + `location`, `technical_skills`, `technical_proficiency`, `career_track_interest`
- `job_opportunities`: + `application_link`
- `allocations`: + `first_assigned_to` (auto-set on creation via trigger, backfilled for existing rows)
- New view `allocation_overview` — one row per active allocation with both first and current
  assignee names already joined in, which is what the redesigned Allocations table queries.
- `student_overview` view recreated (dropped + recreated, not `CREATE OR REPLACE`) to add the new
  student columns — same fix pattern as the migration_002 bug, applied proactively here.

## Not yet done (flagging, not hiding)
- Skillset fields are plain text columns you fill in manually — no bulk-import from your
  consolidated tracker/skillset spreadsheet yet. That's a reasonable next addition if you want it.
- "Duplicates skipped" doesn't exist as a concept — every matched row is updated. If you actually
  want a "leave existing data alone" mode instead of "always overwrite on match," that's a small
  but real behavior decision worth making explicitly before I build it.
