# v8 Rollout Guide

Run **`migration_007_status_and_jobfit.sql`** — the only new SQL, additive on top of everything
through migration_006.

## Dashboard
- **Placed vs Unplaced is now cumulative and percentage-based.** Each period shows the running
  total to date (not just that period's own numbers), as a % of everyone tracked so far — bars for
  Placed%/Unplaced%, with a trend line tracking the Placed% specifically.
- **"Remaining" renamed to "Unplaced"** everywhere it appeared — the stat card, the chart legend,
  the component name internally too, for consistency.
- **Interviewing column removed** from the Staff Accountability Overview table (still shows on
  My Caseload's KPI headline, just not in the admin rollup table).

## Navigation
- **Home page now redirects to `/dashboard`** instead of the student directory.

## Resources Hub
- **Roles removed entirely** — no more internally-hosted job postings table, no more post/edit
  job forms. Replaced with a **"View Applicants on Job Board"** button that links out to the
  external job board.
- **One thing you need to do:** open `lib/constants.ts` and replace the placeholder
  `JOB_BOARD_URL` with the real one.
- What's left is **Documents & Resources** — this is now effectively the resource toolkit home,
  ready for you to start populating with CV templates, guides, etc. (Phase 4 from the
  accountability plan folds naturally into this page — no separate build needed, it's the same
  feature).
- The job posting/applicant-logging database tables (`job_opportunities`, `job_applications`)
  are still there, unused for now — worth keeping since they'll likely matter again once the job
  board API connection happens, rather than deleting and rebuilding later.

## Statuses
- **"Awaiting Placement" renamed to "Available for Work"** everywhere — this is a label change
  only, the underlying status value is unchanged, so nothing breaks for existing data.
- **New status: "Further Skilling"** — distinct from the "Further Skilling" *employment type*
  added earlier (that one describes a job outcome; this one is a placement status for a student
  who's paused active job search to pursue more training). Both can coexist without conflict since
  they're different fields.
- **Foundations now has a job-fit rule** — added a starter set of suggested roles. Worth reviewing
  and adjusting the actual role suggestions to match what you'd really recommend.

## Search
- Fixed the misleading placeholder text — the search field only ever matched student names, never
  email (despite what it said). Text now accurately says "Search by name…".

---

## Your consolidated CSV — what to do

**Good news: column order doesn't matter.** The importer reads columns by their header name, not
by position — so you don't need to rearrange anything in your sheet.

**What I changed to make this work:** the upload feature now also reads `Technical Languages`,
`Technical Proficiency`, and `Career Track of Interest` from your CSV and writes them straight
into the Skillset section on each student's profile — both for new students and when updating
existing ones (so re-uploading refreshes their skillset data too).

**Columns I'd recommend removing** (not because they'll break anything — extra columns are just
silently ignored — but because they're either meaningless outside their original context or
would create confusing duplicate data if kept):
- `Skillset Data Matched` and `Match Method` — these were internal bookkeeping from when I
  merged your two original spreadsheets together. They don't mean anything to the system now.
- `Self-Reported Employment Status`, `Self-Reported Employer`, `Self-Reported Role` — these come
  from students' own survey answers, which can drift out of sync with what your staff have
  actually verified in `Company Name` / `Position Title` / `Placement Status`. I deliberately
  did **not** map these into the system, specifically so unverified self-reports can't silently
  overwrite staff-confirmed placement data. If you want this data preserved somewhere, tell me and
  I'll add a clearly-separate "self-reported" field rather than mixing it into the verified ones.
- `Additional Info` and `Skillset Form Comments` — free text with no clear destination field.
  Fine to drop, or tell me what you'd want done with it and I'll map it somewhere sensible.
- `Skillset Form Submitted At` — no corresponding field on the student profile to receive this.

**Columns that will map automatically once you upload:**
Full Name, Gender, Nationality, Refugee Status, Disability status, Type of Disability, Email,
Phone Number, Program Name, Sponsorship Type, Graduation Date, Cohort, Education Level, Placement
Status, Company Name, Position Title, Placement Date, Salary/Compensation, Notes (new students
only — never overwrites notes already added in-app), Technical Languages, Technical Proficiency,
Career Track of Interest.

One more honest flag: since matching is by email, any row without a valid email will always create
a brand-new student rather than updating one — worth a quick scan of your sheet for blank emails
before uploading, if avoiding accidental duplicates matters here.
