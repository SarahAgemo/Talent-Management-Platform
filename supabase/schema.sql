-- Refactory Academy Talent Management Platform — base schema
-- Run FIRST, then migration_002_talent_features.sql, then migration_003_ui_enhancements.sql.
create extension if not exists "pgcrypto";

create type placement_status as enum ('awaiting_placement','in_preparation','applying','interviewing','offer_extended','placed','declined_withdrawn');
create type employment_type as enum ('full_time','part_time','freelance','contract','internship');
create type user_role as enum ('super_admin','placement_admin','placement_officer','read_only');
create type allocation_status as enum ('active','completed','overdue');

create table public.staff_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, email text not null unique, role user_role not null default 'placement_officer',
  created_at timestamptz not null default now()
);
create table public.programs (
  id uuid primary key default gen_random_uuid(), name text not null, level text not null, created_at timestamptz not null default now()
);
create table public.cohorts (
  id uuid primary key default gen_random_uuid(), program_id uuid not null references public.programs(id) on delete cascade,
  cohort_name text not null, start_date date, created_at timestamptz not null default now()
);
create table public.students (
  id uuid primary key default gen_random_uuid(), full_name text not null,
  gender text, nationality text, refugee_status text, disability_status text, disability_type text, date_of_birth date,
  email text, phone_number text, sponsorship_type text, education_level text, created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade, graduation_date date not null,
  completion_status text not null default 'completed', created_at timestamptz not null default now()
);
create table public.placements (
  id uuid primary key default gen_random_uuid(), student_id uuid not null unique references public.students(id) on delete cascade,
  status placement_status not null default 'awaiting_placement', company_name text, position_title text,
  employment_type employment_type, placement_date date, salary_compensation text, notes text, updated_at timestamptz not null default now()
);
create table public.placement_status_history (
  id uuid primary key default gen_random_uuid(), placement_id uuid not null references public.placements(id) on delete cascade,
  status placement_status not null, changed_at timestamptz not null default now(), changed_by uuid references public.staff_users(id)
);

create or replace function public.set_placement_updated_at() returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end; $$;

create or replace function public.log_placement_status_change() returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') or (NEW.status is distinct from OLD.status) then
    insert into public.placement_status_history (placement_id, status, changed_by) values (NEW.id, NEW.status, auth.uid());
  end if;
  return NEW;
end; $$;

create trigger trg_set_updated_at before insert or update on public.placements for each row execute function public.set_placement_updated_at();
create trigger trg_log_placement_status after insert or update on public.placements for each row execute function public.log_placement_status_change();

create table public.allocations (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  assigned_to uuid not null references public.staff_users(id), assigned_by uuid references public.staff_users(id),
  assigned_at timestamptz not null default now(), deadline date not null,
  allocation_status allocation_status not null default 'active', notes text
);

alter table public.staff_users enable row level security;
alter table public.programs enable row level security;
alter table public.cohorts enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.placements enable row level security;
alter table public.placement_status_history enable row level security;
alter table public.allocations enable row level security;

create policy "read all - staff_users" on public.staff_users for select using (auth.role() = 'authenticated');
create policy "read all - programs" on public.programs for select using (auth.role() = 'authenticated');
create policy "read all - cohorts" on public.cohorts for select using (auth.role() = 'authenticated');
create policy "read all - students" on public.students for select using (auth.role() = 'authenticated');
create policy "read all - enrollments" on public.enrollments for select using (auth.role() = 'authenticated');
create policy "read all - placements" on public.placements for select using (auth.role() = 'authenticated');
create policy "read all - history" on public.placement_status_history for select using (auth.role() = 'authenticated');
create policy "read all - allocations" on public.allocations for select using (auth.role() = 'authenticated');

create policy "admins write - programs" on public.programs for all using (exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin')));
create policy "admins write - cohorts" on public.cohorts for all using (exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin')));
create policy "admins write - students" on public.students for all using (exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin')));
create policy "admins write - enrollments" on public.enrollments for all using (exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin')));
create policy "admins write - allocations" on public.allocations for all using (exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin')));
create policy "admins write - placements" on public.placements for all using (exists (select 1 from public.staff_users su where su.id = auth.uid() and su.role in ('super_admin','placement_admin')));
create policy "officers update own allocations - placements" on public.placements for update using (
  exists (select 1 from public.allocations a where a.student_id = placements.student_id and a.assigned_to = auth.uid() and a.allocation_status = 'active'));

create or replace view public.student_overview as
select s.id as student_id, s.full_name, s.gender, s.nationality, s.refugee_status, s.disability_status, s.disability_type, s.date_of_birth,
  s.email, s.phone_number, s.sponsorship_type, s.education_level, e.graduation_date, c.cohort_name, p.name as program_name, p.level as program_level,
  pl.id as placement_id, pl.status as placement_status, pl.company_name, pl.position_title, pl.employment_type, pl.placement_date, pl.salary_compensation,
  (current_date - e.graduation_date) as days_since_graduation, al.assigned_to, al.deadline as allocation_deadline, al.allocation_status
from public.students s
left join public.enrollments e on e.student_id = s.id
left join public.cohorts c on c.id = e.cohort_id
left join public.programs p on p.id = c.program_id
left join public.placements pl on pl.student_id = s.id
left join public.allocations al on al.student_id = s.id and al.allocation_status = 'active';
