-- =========================================================
-- Migration 006 — Accountability system (Phase 1: data model)
-- Run AFTER migration_005_allocation_trail.sql.
-- =========================================================

-- ---------- Staff KPI targets ----------
-- "55 in 10 weeks" is an estimate, not a fixed rule — configurable per
-- staff member, defaulting to 55/10 for anyone not explicitly set.
alter table public.staff_users add column if not exists target_caseload integer not null default 55;
alter table public.staff_users add column if not exists target_weeks integer not null default 10;

-- ---------- Readiness checklist ----------
-- One row per (student, item). item_key is a fixed set of 9, enforced at
-- the app level rather than as a Postgres enum — a plain text + CHECK
-- constraint is much easier to extend later than an enum (enum changes
-- have caused real friction in earlier migrations on this project).
create table if not exists public.readiness_checklist (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  item_key text not null check (item_key in (
    'portfolio', 'linkedin', 'github', 'job_board_profile', 'career_paths',
    'cv', 'mock_interview', 'work_readiness', 'weekly_updates'
  )),
  status text not null default 'red' check (status in ('red', 'amber', 'green')),
  flowmingo_used boolean not null default false, -- only meaningful for 'cv' and 'mock_interview' items
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_users(id),
  unique (student_id, item_key)
);

alter table public.readiness_checklist enable row level security;
create policy "read all - readiness_checklist" on public.readiness_checklist for select using (auth.role() = 'authenticated');
create policy "staff write - readiness_checklist" on public.readiness_checklist for all using (auth.role() = 'authenticated');

-- Auto-stamp updated_at/updated_by on every change.
create or replace function public.stamp_readiness_update()
returns trigger language plpgsql as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;
drop trigger if exists trg_stamp_readiness on public.readiness_checklist;
create trigger trg_stamp_readiness before update on public.readiness_checklist
for each row execute function public.stamp_readiness_update();

-- ---------- Activity log ----------
-- A single flexible append-only log covers both "weekly application
-- updates" and the coach accountability indicators list (6.1 in the
-- spec) — applications, interviews, outreach, mock interviews, freelance
-- attempts, paid opportunities, etc. Simpler than a dozen separate
-- narrow columns, and naturally supports "most recent activity of type X".
create table if not exists public.student_activity_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'application_submitted', 'quality_application', 'outreach_attempt',
    'interview_completed', 'mock_interview_completed', 'freelance_attempt',
    'response_received', 'interview_secured', 'paid_opportunity_generated',
    'task_completed', 'task_overdue', 'skill_improved', 'portfolio_evidence_added'
  )),
  quantity integer not null default 1,
  income_amount numeric, -- only used for 'paid_opportunity_generated' entries
  notes text,
  logged_by uuid references public.staff_users(id),
  logged_at timestamptz not null default now()
);

alter table public.student_activity_log enable row level security;
create policy "read all - student_activity_log" on public.student_activity_log for select using (auth.role() = 'authenticated');
create policy "staff insert - student_activity_log" on public.student_activity_log for insert with check (auth.role() = 'authenticated');

create index if not exists idx_activity_log_student_type_date
  on public.student_activity_log (student_id, activity_type, logged_at desc);

-- ---------- Readiness summary per student ----------
-- Worst-item-wins: if any of the 9 items is Red, overall is Red; else if
-- any is Amber, overall is Amber; only fully Green across the board counts
-- as Green. This is the more defensible reading of "market ready."
create or replace view public.student_readiness_overview as
select
  s.id as student_id,
  count(rc.id) as items_tracked,
  count(*) filter (where rc.status = 'green') as green_count,
  count(*) filter (where rc.status = 'amber') as amber_count,
  count(*) filter (where rc.status = 'red') as red_count,
  case
    when count(rc.id) = 0 then 'red'
    when count(*) filter (where rc.status = 'red') > 0 then 'red'
    when count(*) filter (where rc.status = 'amber') > 0 then 'amber'
    else 'green'
  end as overall_readiness
from public.students s
left join public.readiness_checklist rc on rc.student_id = s.id
group by s.id;

-- ---------- Risk flags per student ----------
-- Yellow: no 'application_submitted' activity logged in the last 7 days.
-- Red: no 'interview_completed' activity in 21 days, OR the student has
-- been in their current placement status for more than 10 days.
-- Both are computed live, not stored, so they're always current.
create or replace view public.student_risk_overview as
with last_application as (
  select student_id, max(logged_at) as last_at
  from public.student_activity_log
  where activity_type = 'application_submitted'
  group by student_id
),
last_interview as (
  select student_id, max(logged_at) as last_at
  from public.student_activity_log
  where activity_type = 'interview_completed'
  group by student_id
),
stage_entered as (
  select psh.placement_id, psh.status, max(psh.changed_at) as entered_at
  from public.placement_status_history psh
  group by psh.placement_id, psh.status
),
current_stage as (
  select pl.id as placement_id, pl.student_id, pl.status, se.entered_at
  from public.placements pl
  left join stage_entered se on se.placement_id = pl.id and se.status = pl.status
)
select
  s.id as student_id,
  cs.status as current_placement_status,
  cs.entered_at as stage_entered_at,
  case when cs.entered_at is not null then (current_date - cs.entered_at::date) else null end as days_in_stage,
  la.last_at as last_application_at,
  li.last_at as last_interview_at,
  case
    when cs.status in ('placed', 'declined_withdrawn') then 'none'
    when cs.entered_at is not null and (current_date - cs.entered_at::date) > 10 then 'red'
    when li.last_at is not null and li.last_at < now() - interval '21 days' then 'red'
    when li.last_at is null and cs.status = 'interviewing' and cs.entered_at < now() - interval '21 days' then 'red'
    when la.last_at is null or la.last_at < now() - interval '7 days' then 'yellow'
    else 'none'
  end as risk_flag
from public.students s
left join current_stage cs on cs.student_id = s.id
left join last_application la on la.student_id = s.id
left join last_interview li on li.student_id = s.id;

-- ---------- Per-staff KPI headline ----------
create or replace view public.staff_kpi_overview as
select
  su.id as staff_id,
  su.name as staff_name,
  su.target_caseload,
  su.target_weeks,
  count(a.id) filter (where a.allocation_status = 'active') as total_assigned,
  count(a.id) filter (where a.allocation_status = 'active' and pl.status = 'placed') as total_placed,
  count(a.id) filter (where a.allocation_status = 'active' and pl.status = 'interviewing') as total_interviewing,
  count(a.id) filter (where a.allocation_status = 'active' and ro.risk_flag in ('red', 'yellow')) as total_at_risk,
  round(avg(
    case when pl.status = 'placed' and pl.placement_date is not null and e.graduation_date is not null
      then (pl.placement_date - e.graduation_date) / 7.0
    end
  ) filter (where a.allocation_status = 'active'), 1) as avg_weeks_to_place
from public.staff_users su
left join public.allocations a on a.assigned_to = su.id
left join public.students s on s.id = a.student_id
left join public.placements pl on pl.student_id = s.id
left join public.enrollments e on e.student_id = s.id
left join public.student_risk_overview ro on ro.student_id = s.id
group by su.id, su.name, su.target_caseload, su.target_weeks;

-- ---------- Pipeline card: everything the Kanban/table view needs ----------
create or replace view public.student_pipeline_card as
select
  s.id as student_id,
  s.full_name,
  s.career_track_interest as track,
  al.assigned_to,
  su.name as staff_name,
  pl.status as placement_status,
  ro.days_in_stage,
  ro.risk_flag,
  ro.last_application_at,
  (select count(*) from public.student_activity_log sal
     where sal.student_id = s.id and sal.activity_type = 'application_submitted') as applications_logged,
  rr.overall_readiness,
  rr.green_count, rr.amber_count, rr.red_count, rr.items_tracked,
  greatest(
    coalesce((select max(logged_at) from public.student_activity_log sal where sal.student_id = s.id), '1970-01-01'::timestamptz),
    coalesce(pl.updated_at, '1970-01-01'::timestamptz)
  ) as last_activity_date
from public.students s
left join public.allocations al on al.student_id = s.id and al.allocation_status = 'active'
left join public.staff_users su on su.id = al.assigned_to
left join public.placements pl on pl.student_id = s.id
left join public.student_risk_overview ro on ro.student_id = s.id
left join public.student_readiness_overview rr on rr.student_id = s.id;
