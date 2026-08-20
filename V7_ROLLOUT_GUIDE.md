# v7 Rollout Guide — Accountability System, Phase 1 + 2

Run **`migration_006_accountability_system.sql`** — the only new SQL, additive on top of
everything through migration_005.

## What's built

**Readiness Checklist** (student profile) — the 9 items from the doc, each with a Red/Amber/Green
toggle. CV and Mock Interview items have a "Used Flowmingo" checkbox plus a link out to the tool,
matching what you described — just a link and a usage check, no API integration.

**Activity Log** (student profile) — logs any of the 13 accountability indicators (applications,
interviews, outreach, mock interviews, freelance attempts, paid opportunities, etc.), timestamped
and attributed. This single log is what powers application counts, risk flags, and the coach
indicators — one flexible table instead of a dozen narrow ones.

**Risk flags** — computed live, not stored, exactly per the spec:
- 🟡 Yellow: no application logged in 7 days
- 🔴 Red: no interview logged in 21 days, OR stuck more than 10 days in the current placement
  status

Shown on the student profile header, and throughout My Caseload.

**My Caseload** (new nav item) — each staff member's own view:
- KPI headline: Placed/Target in N weeks, Interviewing, At Risk, Avg Weeks to Place — scoped to
  only their assigned students
- Table and Kanban toggle, with filters for stage, risk level, readiness status, and track
- Kanban columns follow the 5-stage model from the doc: Ready → Applying → Interviewing → Offer →
  Placed/Alumni

**Staff Accountability Overview** (added to the shared Dashboard) — the admin-facing rollup: every
staff member's headline numbers in one table, so oversight doesn't require opening each person's
caseload individually.

**Target caseload/weeks are configurable per staff member** (default 55/10, since you said it's an
estimate) — editable directly in Supabase's `staff_users` table for now until there's an in-app
staff management screen.

## Design decisions worth knowing about

- **"Track"** reuses the `career_track_interest` field already on students, rather than adding a
  duplicate column — same concept, one source of truth.
- **Readiness overall status is "worst item wins"** — if any of the 9 items is Red, the student's
  overall readiness shows Red, even if the other 8 are Green. This seemed like the more honest
  reading of "market ready" than an average. Flag it if you'd rather average or weight items.
- **Risk flags don't stop at Placed/Alumni** — a placed or withdrawn student never shows a risk
  flag, regardless of activity history.
- **Flowmingo** is just a static link + checkbox, per what you described — not an integration.
  Replace the placeholder URL in `components/readinessItems.ts` (`FLOWMINGO_URL`) with the real one.

## Not built yet (Phase 3 + 4, unchanged from the original plan)
- Monday auto-generated Hot List playbooks with WhatsApp/email templates
- Friday auto-exported PDF/Sheet reports
- Resource toolkit document library (mechanically similar to the existing Resources Hub —
  lowest-risk phase once you're ready)

Phase 2 gives you everything need to run this manually day-to-day — the automation layer is a
genuine next project, not a small add-on, so it's still worth its own focused pass when you're
ready to move on it.
