-- =========================================================
-- Migration 003 — UI enhancement support
-- Run AFTER migration_002_talent_features.sql. Additive only.
-- =========================================================

-- ---------- Students: location + skillset ----------
-- Skillset fields are kept simple (text) to match what you already have
-- from the consolidated tracker/skillset spreadsheet — not a separate
-- normalized table, since one row per student is enough for display.
alter table public.students add column if not exists location text;
alter table public.students add column if not exists technical_skills text;
alter table public.students add column if not exists technical_proficiency text;
alter table public.students add column if not exists career_track_interest text;

-- ---------- Job opportunities: application link ----------
alter table public.job_opportunities add column if not exists application_link text;

-- ---------- Allocations: track who was first assigned ----------
alter table public.allocations add column if not exists first_assigned_to uuid references public.staff_users(id);

-- Backfill existing rows: their current assignee is the only "first" we know.
update public.allocations set first_assigned_to = assigned_to where first_assigned_to is null;

-- Going forward: set once on creation, never touched again — so reallocating
-- (updating assigned_to) never overwrites who had the student originally.
create or replace function public.set_first_assigned_to()
returns trigger language plpgsql as $$
begin
  if NEW.first_assigned_to is null then
    NEW.first_assigned_to := NEW.assigned_to;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_set_first_assigned_to on public.allocations;
create trigger trg_set_first_assigned_to
before insert on public.allocations
for each row execute function public.set_first_assigned_to();

-- ---------- student_overview: add location + skillset columns ----------
-- Dropped and recreated (not CREATE OR REPLACE) for the same reason as
-- migration_002 — Postgres won't let REPLACE insert columns except at
-- the very end, and it's a view, so nothing is lost by dropping it.
drop view if exists public.student_overview;

create view public.student_overview as
select
  s.id as student_id,
  s.full_name, s.gender, s.nationality, s.refugee_status,
  s.disability_status, s.disability_type, s.date_of_birth,
  s.email, s.phone_number, s.sponsorship_type, s.education_level,
  s.location, s.technical_skills, s.technical_proficiency, s.career_track_interest,
  e.graduation_date,
  c.cohort_name,
  p.id as program_id,
  p.name as program_name,
  p.level as program_level,
  pl.id as placement_id,
  pl.status as placement_status,
  pl.company_name, pl.position_title, pl.employment_type,
  pl.placement_date, pl.salary_compensation,
  (current_date - e.graduation_date) as days_since_graduation,
  al.id as allocation_id, al.assigned_to, al.deadline as allocation_deadline, al.allocation_status,
  (s.disability_status = 'Yes' or s.refugee_status = 'Yes') as needs_inclusion_support,
  (select sd.file_url from public.student_documents sd
     where sd.student_id = s.id and sd.is_current = true limit 1) as current_cv_url
from public.students s
left join public.enrollments e on e.student_id = s.id
left join public.cohorts c on c.id = e.cohort_id
left join public.programs p on p.id = c.program_id
left join public.placements pl on pl.student_id = s.id
left join public.allocations al on al.student_id = s.id and al.allocation_status = 'active';

-- ---------- allocation_overview: everything the redesigned Allocations
-- table needs in one row per active allocation, including both the
-- current and original ("first") assignee names. ----------
create or replace view public.allocation_overview as
select
  a.id as allocation_id,
  a.student_id,
  s.full_name as student_name,
  p.name as program_name,
  pl.status as placement_status,
  (s.disability_status = 'Yes' or s.refugee_status = 'Yes') as needs_inclusion_support,
  a.deadline,
  a.allocation_status,
  a.assigned_to,
  su_current.name as current_staff_name,
  a.first_assigned_to,
  su_first.name as first_staff_name,
  a.assigned_at
from public.allocations a
join public.students s on s.id = a.student_id
left join public.enrollments e on e.student_id = s.id
left join public.cohorts c on c.id = e.cohort_id
left join public.programs p on p.id = c.program_id
left join public.placements pl on pl.student_id = s.id
left join public.staff_users su_current on su_current.id = a.assigned_to
left join public.staff_users su_first on su_first.id = a.first_assigned_to
where a.allocation_status = 'active';
