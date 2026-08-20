-- =========================================================
-- Migration 004 — fixes + small additions
-- Run AFTER migration_003_ui_enhancements.sql. Additive/corrective only.
-- =========================================================

-- ---------- Fix: job_opportunities_view was missing application_link ----------
-- Views built with "select j.*" capture the table's column list at the
-- moment the view is created — adding a column to the table afterward
-- (as migration_003 did) does NOT automatically appear in an existing
-- view. Dropping and recreating picks up application_link correctly.
drop view if exists public.job_opportunities_view;

create view public.job_opportunities_view as
select
  j.*,
  case when j.application_end_date < current_date then 'archived' else 'active' end as posting_status,
  (select count(*) from public.job_applications a where a.job_id = j.id) as applicant_count
from public.job_opportunities j;

-- ---------- Employment type: new options ----------
-- Run these as separate statements (each is its own implicit
-- transaction) — Postgres does not allow using a brand-new enum value
-- in the same transaction that added it, so keep this migration as-is
-- rather than combining these lines with anything that immediately uses
-- the new values.
alter type employment_type add value if not exists 'further_skilling';
alter type employment_type add value if not exists 'self_employed';
alter type employment_type add value if not exists 'unpaid_internship';

-- ---------- Placements: flag for further support needed ----------
-- Defaults to false. The app auto-checks this when Employment type is
-- set to "Unpaid Internship", but it's a real column, not a computed
-- value, so it stays true even if the employment type later changes,
-- and it's independently filterable/reportable.
alter table public.placements add column if not exists needs_further_support boolean not null default false;
