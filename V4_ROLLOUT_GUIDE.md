# v4 Rollout Guide

Run order if starting fresh: `schema.sql` → `migration_002` → `migration_003` → `migration_004`.
You already have schema.sql through migration_003 — **you only need to run
`migration_004_fixes_and_additions.sql`** now.

## Bug fixed
- Job application links were showing blank because `job_opportunities_view` was created (in
  migration_002) before `application_link` existed as a column. Postgres views expand `SELECT *`
  at creation time, so adding the column later never flowed into the view automatically.
  migration_004 drops and recreates it correctly — this also fixes the same missing link on the
  Archived table, since both used the same broken view.

## What's new in the app

**Resources Hub** — split into three pages matching a sub-nav bar (mirroring the Students page
pattern): **Open Opportunities** (includes the post form), **Archived**, and **Documents &
Templates** (includes the add-resource form). Less congested, and sets up cleanly for the future
job-board integration you mentioned — that'll plug into the same `job_opportunities` /
`job_applications` tables, so applicant-to-profile visibility is already the intended design, not
a retrofit.

**Job postings are now editable** — an Edit link/button (Admin-only) on both the job table rows
and the job detail page, using the same form as posting, just pre-filled and switched to update.

**Student profile — Student Details and Skillset are now editable in place** — click Edit on
either card, change fields, Save. No schema change was needed for this since those columns
already existed; this was pure UI work.

**Employment type** — now includes Freelance/Gig Work (relabeled, not a new option), Self-Employed,
Further Skilling, and Unpaid Internship. Selecting Unpaid Internship auto-checks a new "needs
further support" flag, which you can also toggle manually regardless of employment type — it's a
real column (`needs_further_support` on `placements`), so it stays queryable even if the
employment type changes later.

**Dashboard** — added Placement Rate by Sponsorship Type, using the same bar-chart component as
the Program chart (generalized to take any category).

## Decision point — not silently handled

**Only Admins can edit Student Details and Skillset right now.** The existing RLS policy on the
`students` table restricts writes to `super_admin`/`placement_admin` — the new edit forms inherit
that automatically. If Officers should be able to edit their own allocated students' details too
(seems plausible given they're the ones talking to these students), that's a one-line policy
change, but I didn't make it without confirming — broadening write access to personal/demographic
data is worth an explicit yes rather than a default.

## Next: visual design pass
This round was all function. Once you're ready, send over Refactory's logo and brand colors and
we'll move to color, typography, and layout/alignment polish across the whole app.
