-- =========================================================
-- Migration 005 — allocation history trail + assigned-staff visibility
-- Run AFTER migration_004_fixes_and_additions.sql.
-- =========================================================

-- ---------- Allocations: support a real history trail ----------
-- Model change: reallocating a student no longer overwrites the existing
-- allocation row. Instead the old row is marked 'reallocated' and a new
-- row is inserted as the active one — so every allocation and
-- reallocation a student has ever had stays queryable, with a reason
-- attached to each.
alter type allocation_status add value if not exists 'reallocated';
alter table public.allocations add column if not exists reason text;

-- first_assigned_to now needs to look across a student's whole history,
-- not just the row being inserted — otherwise every reallocation would
-- reset "who had this student first."
create or replace function public.set_first_assigned_to()
returns trigger language plpgsql as $$
declare
  earliest uuid;
begin
  if NEW.first_assigned_to is null then
    select first_assigned_to into earliest
    from public.allocations
    where student_id = NEW.student_id
    order by assigned_at asc
    limit 1;

    NEW.first_assigned_to := coalesce(earliest, NEW.assigned_to);
  end if;
  return NEW;
end;
$$;
-- (trigger itself already exists from migration_003, this just replaces the function body)

-- ---------- Full allocation trail, for the student profile ----------
create or replace view public.allocation_trail as
select
  a.id as allocation_id,
  a.student_id,
  a.assigned_to,
  su.name as staff_name,
  a.assigned_by,
  su_by.name as assigned_by_name,
  a.assigned_at,
  a.deadline,
  a.allocation_status,
  a.reason
from public.allocations a
left join public.staff_users su on su.id = a.assigned_to
left join public.staff_users su_by on su_by.id = a.assigned_by
order by a.assigned_at desc;

-- ---------- student_overview: add currently-assigned staff name ----------
-- Dropped and recreated for the same reason as prior migrations — adding
-- a joined column needs the view rebuilt, not just replaced.
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
  pl.placement_date, pl.salary_compensation, pl.needs_further_support,
  (current_date - e.graduation_date) as days_since_graduation,
  al.id as allocation_id, al.assigned_to, al.deadline as allocation_deadline, al.allocation_status,
  su.name as assigned_staff_name,
  (s.disability_status = 'Yes' or s.refugee_status = 'Yes') as needs_inclusion_support,
  (select sd.file_url from public.student_documents sd
     where sd.student_id = s.id and sd.is_current = true limit 1) as current_cv_url
from public.students s
left join public.enrollments e on e.student_id = s.id
left join public.cohorts c on c.id = e.cohort_id
left join public.programs p on p.id = c.program_id
left join public.placements pl on pl.student_id = s.id
left join public.allocations al on al.student_id = s.id and al.allocation_status = 'active'
left join public.staff_users su on su.id = al.assigned_to;
