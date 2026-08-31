-- Molo Mhlaba Behaviour Tracker — initial schema
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------- CAMPUSES ----------
create table campuses (
  id text primary key,                 -- e.g. 'TEN'
  name text not null,                  -- e.g. 'Tennyson Campus'
  short_code text not null,
  brand_color text not null,           -- hex, e.g. '#ED1C2E'
  sort_order int not null default 0
);

-- ---------- BEHAVIOUR CATEGORIES (reference) ----------
create table behaviour_categories (
  name text primary key,
  description text not null,
  example_behaviours text not null,
  ilp_focus_area text not null,
  sort_order int not null default 0
);

-- ---------- ILP BRIDGE NOTES (reference) ----------
create table ilp_bridge_notes (
  trend_group text primary key references behaviour_categories(name) on delete cascade,
  ilp_goal_domain text not null,
  data_feed_notes text not null
);

-- ---------- BOOTSTRAP ADMINS ----------
-- Emails listed here are automatically granted the 'admin' role (all-campus access)
-- the first time they sign up. Edit this table in the SQL editor to add more before
-- your other admins create their accounts.
create table bootstrap_admins (
  email text primary key
);

-- ---------- PROFILES (one row per authenticated user) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'pending' check (role in ('pending', 'staff', 'admin')),
  campus_id text references campuses(id),   -- null = access to all campuses (district/admin scope)
  created_at timestamptz not null default now()
);

-- ---------- STUDENTS ----------
create table students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique,             -- e.g. 'TEN-0001', assigned on insert
  campus_id text not null references campuses(id),
  full_name text not null,
  class text,
  teacher text,
  date_of_birth date,
  gender text,
  enrolment_date date default current_date,
  allergies text,
  medical_conditions text,
  emotional_issues text,
  psychological_problems text,
  social_issues text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Per-campus sequence counters, used to generate human-readable student/incident codes.
create table campus_seq (
  campus_id text not null references campuses(id),
  kind text not null check (kind in ('student', 'incident')),
  next_seq int not null default 1,
  primary key (campus_id, kind)
);

create or replace function next_campus_seq(p_campus_id text, p_kind text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq int;
begin
  insert into campus_seq (campus_id, kind, next_seq)
  values (p_campus_id, p_kind, 2)
  on conflict (campus_id, kind) do update set next_seq = campus_seq.next_seq + 1
  returning next_seq - 1 into v_seq;
  return v_seq;
end;
$$;

create or replace function set_student_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.student_code is null then
    new.student_code := new.campus_id || '-' || lpad(next_campus_seq(new.campus_id, 'student')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_student_code
  before insert on students
  for each row execute function set_student_code();

-- ---------- INCIDENTS ----------
create table incidents (
  id uuid primary key default gen_random_uuid(),
  log_code text unique,
  campus_id text not null references campuses(id),
  student_id uuid not null references students(id) on delete cascade,
  date date not null default current_date,
  category text not null references behaviour_categories(name),
  specific_behaviour text,
  trigger_context text,
  location text,
  severity int not null check (severity between 1 and 5),
  duration_min int,
  intervention_used text,
  outcome text,
  staff_reporting uuid references profiles(id),
  staff_reporting_name text,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function set_incident_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.log_code is null then
    new.log_code := new.campus_id || '-' || lpad(next_campus_seq(new.campus_id, 'incident')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_incident_code
  before insert on incidents
  for each row execute function set_incident_code();

create index idx_students_campus on students(campus_id);
create index idx_incidents_campus on incidents(campus_id);
create index idx_incidents_student on incidents(student_id);
create index idx_incidents_date on incidents(date desc);

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'pending';
begin
  if exists (select 1 from bootstrap_admins b where lower(b.email) = lower(new.email)) then
    v_role := 'admin';
  end if;
  insert into public.profiles (id, email, full_name, role, campus_id)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', v_role, null);
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- HELPER FUNCTIONS FOR RLS ----------
create or replace function my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_campus()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select campus_id from profiles where id = auth.uid();
$$;

create or replace function in_my_scope(p_campus_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select my_campus() is null or my_campus() = p_campus_id;
$$;

-- ---------- ROW LEVEL SECURITY ----------
alter table campuses enable row level security;
alter table behaviour_categories enable row level security;
alter table ilp_bridge_notes enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table incidents enable row level security;
alter table campus_seq enable row level security;
alter table bootstrap_admins enable row level security;

-- Reference data: any signed-in user (any role, including 'pending') can read.
create policy "reference read" on campuses for select to authenticated using (true);
create policy "reference read" on behaviour_categories for select to authenticated using (true);
create policy "reference read" on ilp_bridge_notes for select to authenticated using (true);

-- Only admins can manage campuses / reference tables.
create policy "admin write campuses" on campuses for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin write categories" on behaviour_categories for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin write ilp" on ilp_bridge_notes for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- Profiles: everyone can see their own row; admins can see & manage everyone's.
create policy "own profile select" on profiles for select to authenticated
  using (id = auth.uid() or my_role() = 'admin');
create policy "own profile update" on profiles for update to authenticated
  using (id = auth.uid() or my_role() = 'admin')
  with check (id = auth.uid() or my_role() = 'admin');
create policy "admin insert profile" on profiles for insert to authenticated
  with check (my_role() = 'admin');

-- Students: staff/admin can read within their campus scope; only admins write.
create policy "students select in scope" on students for select to authenticated
  using (my_role() in ('staff', 'admin') and in_my_scope(campus_id));
create policy "students admin write" on students for all to authenticated
  using (my_role() = 'admin' and in_my_scope(campus_id))
  with check (my_role() = 'admin' and in_my_scope(campus_id));

-- Incidents: staff/admin can read within scope; staff/admin can log incidents within scope,
-- attributed to themselves; only admins may update/delete (corrections).
create policy "incidents select in scope" on incidents for select to authenticated
  using (my_role() in ('staff', 'admin') and in_my_scope(campus_id));
create policy "incidents insert in scope" on incidents for insert to authenticated
  with check (
    my_role() in ('staff', 'admin')
    and in_my_scope(campus_id)
    and staff_reporting = auth.uid()
  );
create policy "incidents admin update" on incidents for update to authenticated
  using (my_role() = 'admin' and in_my_scope(campus_id))
  with check (my_role() = 'admin' and in_my_scope(campus_id));
create policy "incidents admin delete" on incidents for delete to authenticated
  using (my_role() = 'admin' and in_my_scope(campus_id));

-- campus_seq / bootstrap_admins: no direct client access (only touched via security definer functions).
create policy "no direct access" on campus_seq for all to authenticated using (false) with check (false);
create policy "admin read bootstrap admins" on bootstrap_admins for select to authenticated using (my_role() = 'admin');
create policy "admin write bootstrap admins" on bootstrap_admins for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');
