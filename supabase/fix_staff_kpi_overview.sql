-- Fixes a bug in migration_006: subtracting two `date` values in Postgres
-- already returns a plain integer (number of days) — extract(day from ...)
-- only works on an interval, not an integer, hence the error. Just divide
-- the integer directly. Safe to run — this only touches a view.

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
