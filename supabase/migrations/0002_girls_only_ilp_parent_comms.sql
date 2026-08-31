-- Molo Mhlaba Behaviour Tracker — 0002
-- Run this once after 0001_init.sql + seed.sql (any order relative to seed.sql).
--
-- Adds:
--   1. Girls-only enrolment: gender fixed to 'Female'.
--   2. Age range 3-13 enforced on date_of_birth (required going forward).
--   3. Required parent/guardian contact (name + validated email) — every
--      admission needs a way for the school to reach a parent.
--   4. Individual Learning Plans (ILP) per student.
--   5. Parent communication log per student.
--   6. Relaxed incident-insert policy so an admin can bulk-import historical
--      incidents (CSV import) attributed to staff who may not have accounts.

-- ---------- GIRLS-ONLY, AGE RANGE, PARENT CONTACT ----------
alter table students alter column gender set default 'Female';
update students set gender = 'Female' where gender is distinct from 'Female';
alter table students add constraint students_gender_female check (gender = 'Female');

alter table students alter column date_of_birth set not null;
alter table students add constraint students_age_range check (
  extract(year from age(current_date, date_of_birth)) between 3 and 13
);

alter table students add column if not exists parent_name text;
alter table students add column if not exists parent_email text;
update students set parent_email = 'unknown@molomhlaba.org' where parent_email is null;
alter table students alter column parent_email set not null;
alter table students add constraint students_parent_email_format check (
  parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
alter table students alter column parent_name set not null;

-- ---------- INDIVIDUAL LEARNING PLANS ----------
create table ilp_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  goal_domain text not null,
  goal_text text not null,
  strategies text,
  target_date date,
  status text not null default 'active' check (status in ('active', 'achieved', 'discontinued')),
  created_by uuid references profiles(id),
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_ilp_plans_student on ilp_plans(student_id);
alter table ilp_plans enable row level security;

create policy "ilp select in scope" on ilp_plans for select to authenticated
  using (exists (
    select 1 from students s where s.id = ilp_plans.student_id
    and my_role() in ('staff', 'admin') and in_my_scope(s.campus_id)
  ));
create policy "ilp insert in scope" on ilp_plans for insert to authenticated
  with check (exists (
    select 1 from students s where s.id = ilp_plans.student_id
    and my_role() in ('staff', 'admin') and in_my_scope(s.campus_id)
  ));
create policy "ilp update in scope" on ilp_plans for update to authenticated
  using (exists (
    select 1 from students s where s.id = ilp_plans.student_id
    and my_role() in ('staff', 'admin') and in_my_scope(s.campus_id)
  ))
  with check (exists (
    select 1 from students s where s.id = ilp_plans.student_id
    and my_role() in ('staff', 'admin') and in_my_scope(s.campus_id)
  ));
create policy "ilp delete admin" on ilp_plans for delete to authenticated
  using (exists (
    select 1 from students s where s.id = ilp_plans.student_id
    and my_role() = 'admin' and in_my_scope(s.campus_id)
  ));

-- ---------- PARENT COMMUNICATION LOG ----------
create table parent_communications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'phone', 'in_person', 'other')),
  date date not null default current_date,
  subject text,
  summary text not null,
  related_incident_id uuid references incidents(id) on delete set null,
  logged_by uuid references profiles(id),
  logged_by_name text,
  created_at timestamptz not null default now()
);
create index idx_parent_comms_student on parent_communications(student_id);
alter table parent_communications enable row level security;

create policy "parent comms select in scope" on parent_communications for select to authenticated
  using (exists (
    select 1 from students s where s.id = parent_communications.student_id
    and my_role() in ('staff', 'admin') and in_my_scope(s.campus_id)
  ));
create policy "parent comms insert in scope" on parent_communications for insert to authenticated
  with check (exists (
    select 1 from students s where s.id = parent_communications.student_id
    and my_role() in ('staff', 'admin') and in_my_scope(s.campus_id)
  ));
create policy "parent comms admin update" on parent_communications for update to authenticated
  using (exists (
    select 1 from students s where s.id = parent_communications.student_id
    and my_role() = 'admin' and in_my_scope(s.campus_id)
  ))
  with check (exists (
    select 1 from students s where s.id = parent_communications.student_id
    and my_role() = 'admin' and in_my_scope(s.campus_id)
  ));
create policy "parent comms admin delete" on parent_communications for delete to authenticated
  using (exists (
    select 1 from students s where s.id = parent_communications.student_id
    and my_role() = 'admin' and in_my_scope(s.campus_id)
  ));

-- ---------- ALLOW ADMIN BULK IMPORT OF HISTORICAL INCIDENTS ----------
-- Previously every inserted incident had to be attributed to the inserting
-- user (staff_reporting = auth.uid()). That's still required for a staff
-- member logging their own incident, but an admin doing a CSV import of
-- historical records (attributed to a staff member's name, not necessarily
-- their own account, or to nobody) needs to be able to set staff_reporting
-- to any value in scope, including null.
drop policy "incidents insert in scope" on incidents;
create policy "incidents insert in scope" on incidents for insert to authenticated
  with check (
    my_role() in ('staff', 'admin')
    and in_my_scope(campus_id)
    and (my_role() = 'admin' or staff_reporting = auth.uid())
  );
