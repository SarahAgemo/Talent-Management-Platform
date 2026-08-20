# v6 Rollout Guide

Run **`migration_005_allocation_trail.sql`** — that's the only new SQL. Everything else here is app code.

## Bug fixed
**Allocation changes not reflecting** — this was a real Next.js caching bug, not a Supabase or data
issue. The App Router caches server-side data fetches by default; without telling it not to,
pages could keep serving a stale snapshot until the cache happened to expire. Added
`export const dynamic = "force-dynamic"` to every page that reads live data (students, student
profile, allocations, dashboard, resources) — they'll always fetch fresh now.

## Allocations
- **Reallocating no longer overwrites history.** The old allocation row is marked `reallocated`
  and a new active row is inserted — every allocation and reallocation a student has ever had is
  now a real, queryable row, not a value that gets replaced.
- **Reallocation now requires a reason** (a required textarea in the modal) — saved alongside that
  history row.
- **Student profile shows the full trail**, not just the current assignment: every allocation
  event, who made it, when, the deadline set, and the reason if it was a reallocation.
- **Staff filter** added to the Allocated Students table, and an **Assigned to** filter (including
  "Unassigned only") added to the Student Directory.
- `first_assigned_to` logic was corrected too — it was resetting on every reallocation before;
  now it correctly looks back across a student's whole history and only ever reflects who had them
  *first*, regardless of how many reallocations happen after.

## Resources Hub
- Restructured to match the target job-board layout: **Roles** (unified — no more separate
  Archived page, closed roles just show a "Closed" status badge alongside open ones, with
  All/Open/Closed filter buttons) and **Documents & Templates**.
- **Not yet wired to the external job board API** — the endpoints haven't arrived yet, so this
  still runs on the system's own `job_opportunities` table. The layout is built to match what
  you'll get from the API (Role/Employer/Location/Due/Status/Applicants), so swapping the data
  source later should be a fetch-layer change, not a redesign. Send the endpoint details whenever
  they're ready and I'll wire it in.

## Dashboard
- Placed vs Remaining is now a bar chart (Placed/Remaining as bars) with a placement-rate trend
  line overlaid on a secondary axis — the combination view you asked for.

## General
- **Pagination** (10 per page) added everywhere it was missing: both Allocations tables, the
  Roles table, and Documents & Templates. Student Directory already had it.
- **Top nav reordered**: Dashboard, Upload, Students, Allocations, Resources.
- **Password reset** — a "Forgot your password?" link on the login page leads to a reset-email
  flow, and a new `/reset-password` page lets someone set a new password from that email link.
  **This needs one thing configured in Supabase's dashboard first** (can't be done via code): go to
  Authentication > URL Configuration and make sure your deployed site's URL (and
  `http://localhost:3000` for local testing) are in the allowed Redirect URLs list, or the reset
  link won't work.
- **Font** — changed to **Poppins**, not literally Century Gothic. Century Gothic is a licensed
  Monotype font with no free web-hosted version — Poppins is the closest widely-used free
  alternative (geometric sans, similar rounded letterforms). If you have a licensed copy of the
  actual Century Gothic font files, send them over and I'll self-host it properly instead.
- **Assigned/Unassigned column** added to the Student Directory table.
- **Upload page** content is now centered.

---

# Section 1 (Accountability: KPIs, readiness, risk flags, weekly reports, toolkit) — not built yet

This is genuinely a second system, not a page update: time-boxed pipeline stages, a 9-item
readiness checklist with R/A/G status per student, automated risk flagging, Monday
auto-generated "Hot List" playbooks with WhatsApp/email templates, Friday auto-exported
PDF/Sheet reports, a full resource toolkit library, and coach-level progress indicators.

I didn't want to guess at build order on something this size. Rough phasing, for you to
reprioritize:

1. **Data model first** — readiness checklist items, risk flag rules, the 10-week stage model,
   and the indicators list all need schema before anything else can work.
2. **Manual version of the dashboard** — staff KPI headline numbers, per-student readiness
   checklist, Kanban/table pipeline view with risk flags — all viewable and editable in-app,
   no automation yet.
3. **Automation layer** — the Monday playbook generation and Friday report export. This is the
   most complex piece (scheduled jobs, templated messages, PDF/Sheet generation) and depends on
   phase 2 being solid first.
4. **Resource toolkit library** — mechanically similar to the existing Resources Hub documents
   feature, so this is the lowest-risk phase once the rest exists.

Tell me where you want to start and I'll turn that phase into its own user-stories-and-schema doc,
same as we did for the original build, before writing code.
