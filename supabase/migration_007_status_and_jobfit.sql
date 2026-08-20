-- =========================================================
-- Migration 007 — status addition + missing job-fit rule
-- Run AFTER migration_006_accountability_system.sql.
-- =========================================================

-- ---------- New placement status: Further Skilling ----------
-- Distinct from the "further_skilling" employment_type added in
-- migration_004 (which describes a job outcome). This one is a
-- placement STATUS — a student who has paused active job search to
-- pursue additional training. Counts as "unplaced" for dashboard
-- purposes, same as every other non-'placed' status.
alter type placement_status add value if not exists 'further_skilling';

-- ---------- Job-fit rule for Foundations ----------
-- Matches by ILIKE so this catches the program however it was named on
-- upload ("Foundations", "Foundations of Software Development", etc.).
insert into public.job_fit_rules (program_id, suggested_roles)
select id, array['Junior Support Associate', 'IT Helpdesk', 'Trainee — Advanced Track']
from public.programs
where name ilike '%foundation%'
  and id not in (select program_id from public.job_fit_rules where program_id is not null)
on conflict do nothing;
