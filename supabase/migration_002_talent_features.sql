-- =========================================================
-- Migration 002 — Talent Tracker v2 features (corrected)
-- Run this AFTER schema.sql. Additive only — safe against a database
-- with real data. This replaces the earlier version of this file —
-- if your previous attempt errored partway through, Supabase rolled
-- the whole script back, so it's safe to just run this one cleanly.
-- =========================================================

-- ---------- Inclusion Lead tag ----------
alter table public.staff_users
  add column if not exists is_inclusion_lead boolean not null default false;

-- ---------- CV / document versioning ----------
create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  file_url text not null,
  file_name text,
  is_current boolean not null default true,
  uploaded_by uuid references public.staff_users(id),
  uploaded_at timestamptz not null default now()
);

create or replace function public.set_single_current_document()
returns trigger language plpgsql as $$
begin
  if NEW.is_current then
    update public.student_documents
    set is_current = false
    where student_id = NEW.student_id and id <> NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_single_current_document on public.student_documents;
create trigger trg_single_current_document
after insert on public.student_documents
for each row execute function public.set_single_current_document();

-- ---------- Comments / progress log ----------
create table if not exists public.student_comments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  staff_id uuid references public.staff_users(id),
  comment text not null,
  created_at timestamptz not null default now()
);

-- ---------- Job-fit lookup ----------
create table if not exists public.job_fit_rules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  level text,
  suggested_roles text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Job opportunities (Resources Hub) ----------
create table if not exists public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text not null,
  description text,
  location text,
  employment_type employment_type,
  application_start_date date,
  application_end_date date not null,
  posted_by uuid references public.staff_users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_opportunities(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  applied_at timestamptz not null default now(),
  logged_by uuid references public.staff_users(id),
  status text not null default 'applied',
  unique (job_id, student_id)
);

-- ---------- Resource documents ----------
create table if not exists public.resource_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  file_url text not null,
  uploaded_by uuid references public.staff_users(id),
  uploaded_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.student_documents enable row level security;
alter table public.student_comments enable row level security;
alter table public.job_fit_rules enable row level security;
alter table public.job_opportunities enable row level security;
alter table public.job_applications enable row level security;
alter table public.resource_documents enable row level security;

drop policy if exists "read all - student_documents" on public.student_documents;
create policy "read all - student_documents" on public.student_documents for select using (auth.role() = 'authenticated');
drop policy if exists "read all - student_comments" on public.student_comments;
create policy "read all - student_comments" on public.student_comments for select using (auth.role() = 'authenticated');
drop policy if exists "read all - job_fit_rules" on public.job_fit_rules;
create policy "read all - job_fit_rules" on public.job_fit_rules for select using (auth.role() = 'authenticated');
drop policy if exists "read all - job_opportunities" on public.job_opportunities;
create policy "read all - job_opportunities" on public.job_opportunities for select using (auth.role() = 'authenticated');
drop policy if exists "read all - job_applications" on public.job_applications;
create policy "read all - job_applications" on public.job_applications for select using (auth.role() = 'authenticated');
drop policy if exists "read all - resource_documents" on public.resource_documents;
create policy "read all - resource_documents" on public.resource_documents for select using (auth.role() = 'authenticated');

drop policy if exists "staff write - student_documents" on public.student_documents;
create policy "staff write - student_documents" on public.student_documents for insert with check (auth.role() = 'authenticated');
drop policy if exists "staff update - student_documents" on public.student_documents;
create policy "staff update - student_documents" on public.student_documents for update using (auth.role() = 'authenticated');

drop policy if exists "staff insert - student_comments" on public.student_comments;
create policy "staff insert - student_comments" on public.student_comments for insert with check (auth.role() = 'authenticated');

drop policy if exists "staff write - job_applications" on public.job_applications;
create policy "staff write - job_applications" on public.job_applications for insert with check (auth.role() = 'authenticated');
drop policy if exists "staff update - job_applications" on public.job_applications;
create policy "staff update - job_applications" on public.job_applications for update using (auth.role() = 'authenticated');

drop policy if exists "admins write - job_opportunities" on public.job_opportunities;
create policy "admins write - job_opportunities" on public.job_opportunities for all using (
  exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin'))
);
drop policy if exists "admins write - resource_documents" on public.resource_documents;
create policy "admins write - resource_documents" on public.resource_documents for all using (
  exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin'))
);
drop policy if exists "admins write - job_fit_rules" on public.job_fit_rules;
create policy "admins write - job_fit_rules" on public.job_fit_rules for all using (
  exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin'))
);

-- ---------- Job opportunities with computed archive state ----------
create or replace view public.job_opportunities_view as
select
  j.*,
  case when j.application_end_date < current_date then 'archived' else 'active' end as posting_status,
  (select count(*) from public.job_applications a where a.job_id = j.id) as applicant_count
from public.job_opportunities j;

-- ---------- student_overview, extended ----------
-- Dropped and recreated rather than CREATE OR REPLACE: Postgres won't
-- let REPLACE insert new columns in the middle of an existing view's
-- column list, only append at the end. This is a view, not a table —
-- dropping it costs nothing, no data lives in a view.
drop view if exists public.student_overview;

create view public.student_overview as
select
  s.id as student_id,
  s.full_name, s.gender, s.nationality, s.refugee_status,
  s.disability_status, s.disability_type, s.date_of_birth,
  s.email, s.phone_number, s.sponsorship_type, s.education_level,
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
