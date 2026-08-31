# Molo Mhlaba Behaviour Tracker

A real, multi-campus behaviour tracking system for Molo Mhlaba Schools (Tennyson,
Masibambane, Ncumo campuses). Replaces the AppSheet simulation with a live app:
staff sign in, log incidents, and manage students against a real Postgres
database with row-level security — nothing here is fake or in-memory.

- **Web + installable app (PWA)** — one React codebase, works in any browser and
  installs to the home screen on iOS/Android like a native app (offline shell,
  own icon, no browser chrome).
- **Backend**: [Supabase](https://supabase.com) — Postgres + Auth + Row Level
  Security. No separate server to run.
- **Hosting**: [Netlify](https://netlify.com).

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Pick any region
   close to South Africa (e.g. `eu-west` or `af-south-1` if offered).
2. Once it's created, open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` — creates all tables, functions, and
     row-level security policies.
   - `supabase/seed.sql` — loads the real campuses (Tennyson/Masibambane/Ncumo),
     the 8 behaviour categories, and the ILP bridge notes. **No fake students or
     incidents are seeded** — the roster starts empty.
   - `supabase/migrations/0002_girls_only_ilp_parent_comms.sql` — enforces that
     Molo Mhlaba enrols girls aged 3–13 only (gender fixed to `Female`, a
     date-of-birth age check), makes a parent/guardian name + validated email
     required on every student record, adds Individual Learning Plan (ILP) and
     parent-communication-log tables, and allows an admin to bulk-import
     historical incidents via CSV (see below).
   - `supabase/migrations/0003_campus_logos.sql` — adds a `logo_url` column to
     `campuses` and points each campus at its logo file (see "Campus logos"
     below).
3. In **Authentication → Providers**, confirm Email is enabled. For a quick
   start, go to **Authentication → Settings** and turn **off** "Confirm email"
   so staff can sign in immediately after creating an account (or set up SMTP
   under **Authentication → Emails** if you'd rather require confirmation).
4. In **Authentication → Settings → Bootstrap admin**: this project seeds
   `bootstrap_admins` with `sadik@molomhlaba.org`. Whoever signs up in the
   app with that email is automatically made an `admin` (access to every
   campus, can manage students and staff). To use a different email, edit the
   `bootstrap_admins` table in the SQL editor before that person signs up:
   ```sql
   insert into bootstrap_admins (email) values ('admin@yourschool.co.za');
   ```
5. Copy **Project Settings → API → Project URL** and the **anon public** key —
   you'll need both for step 2.

## 2. Configure environment variables

Copy `.env.example` to `.env` for local development:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

In Netlify, set the same two variables under **Site configuration →
Environment variables**, then redeploy.

## 3. Run it locally

```
npm install
npm run dev
```

## 4. Deploy to Netlify

This repo includes `netlify.toml` (build command `npm run build`, publishes
`dist`, SPA redirect). Connect the repo in Netlify (**Add new site → Import
an existing project**) or deploy via the Netlify CLI:

```
npm run build
netlify deploy --prod
```

Make sure `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set in the site's
environment variables — without them the app shows a "Setup needed" screen
instead of crashing.

## 5. First sign-in

1. Open the deployed URL and choose **Create an account** using the bootstrap
   admin email you configured in step 1.4.
2. You're now signed in as an admin with access to all campuses. Go to
   **More → Manage students** to add real students, and **More → Manage
   staff & roles** to approve other staff as they sign up (new sign-ups start
   as `pending` with no data access until an admin assigns them a role and
   campus).

## 6. Install as a mobile app

- **Android (Chrome)**: open the site → menu (⋮) → **Add to Home screen**.
- **iOS (Safari)**: open the site → Share → **Add to Home Screen**.

It then launches full-screen with its own icon, and the app shell works
offline (data itself always requires a live connection — nothing about
student records is cached for offline editing).

## Enrolment rules

Molo Mhlaba enrols girls aged 3–13 only, and every admission requires a
parent/guardian contact email (the school's primary communication channel).
These are enforced in the database, not just the UI:

- `gender` is fixed to `'Female'` by a check constraint.
- `date_of_birth` is required and must place the learner between 3 and 13
  years old (checked server-side, re-validated on any edit).
- `parent_name` and `parent_email` (format-validated) are required on every
  student row.

## Importing data from CSV

**More → Manage students → Import students / behaviour log from CSV** lets
an admin bulk-load a roster or historical incident log without touching SQL —
built for non-technical staff, matching the project brief's ask for tools
"practical enough for teachers to adopt independently."

- **Students CSV** columns: `student_code, campus_id, full_name, class,
  teacher, date_of_birth, enrolment_date, allergies, medical_conditions,
  emotional_issues, psychological_problems, social_issues, notes,
  parent_name, parent_email`. `campus_id` must be `TEN`/`MAS`/`NCU`;
  `date_of_birth` must give an age of 3–13; `parent_name`/`parent_email` are
  required per row (the importer will not fabricate contact details — rows
  missing them are skipped and reported).
- **Behaviour log CSV** columns: `student_code, campus_id, date, category,
  specific_behaviour, trigger_context, location, severity, duration_min,
  intervention_used, outcome, staff_reporting_name, notes`. `student_code`
  must match a student already imported; import students first.

Two ready-to-use sample CSVs (`students_import_demo.csv`,
`incidents_import_demo.csv`) are built from the school's real sample
workbook, filtered to the female learners only, spanning April–July 2026 so
Trends/Home actually show something once imported. **Their `parent_name` /
`parent_email` columns are intentionally left blank** — fill in real contacts
before importing, since the app won't invent them. Alternatively, Supabase's
own **Table Editor → Insert → Import data from CSV** works directly against
the `students`/`incidents` tables for a one-off load, no app deploy required.

## Campus logos

Each campus's triangular "M" mark is shown in the header, the campus switcher,
and the home screen's campus cards. The app reads it from `campuses.logo_url`
(a path served from `public/`) — it does not store the image itself.

Save the three logo files here before deploying:

```
public/logos/tennyson.png     (red mark — Tennyson Campus)
public/logos/masibambane.png  (blue mark — Masibambane Campus)
public/logos/ncumo.png        (orange mark — Ncumo Campus)
```

`supabase/migrations/0003_campus_logos.sql` points each campus row at those
exact paths. If you rename the files or host them elsewhere, update that
migration (or run an `update campuses set logo_url = '...' where id = '...'`
in the SQL editor) to match. A campus with no `logo_url` falls back to its
flat `brand_color` swatch, so the app still works before the files are added.

## Individual Learning Plans & parent communication

Each student's page (Students → tap a student) now has two more sections:

- **Individual Learning Plan** — goals prefilled from the learner's dominant
  behaviour trend (via the ILP bridge notes), editable, with an
  achieved/discontinued status.
- **Parent communication** — a one-click "Email parent" action (opens your
  own mail client, prefilled, sent from your real school address — no
  third-party email service wired up yet) plus a log of every communication
  (channel, date, summary) so contact history persists beyond one teacher's
  memory.

For teachers who prefer paper, printable Word versions of both — an **ILP
Template** and a **Parent/Guardian Contact & Communication Form** (with the
same required-email consent language) — are included as separate documents
alongside this repo, matching the apprenticeship brief's explicit ask for
these as standalone resources.

## Roles & data scoping

- **admin**: `campus_id = null` → sees and manages every campus; can add
  students, log incidents, and change other users' roles/campus.
- **staff**: `campus_id` set to one campus → can log incidents and view
  students/incidents for that campus only (enforced by Postgres row-level
  security, not just the UI).
- **pending**: default role for new sign-ups; no data access until an admin
  approves them.

## Project structure

```
supabase/migrations/0001_init.sql                      schema + RLS policies
supabase/migrations/0002_girls_only_ilp_parent_comms.sql  enrolment rules, ILP, parent comms, CSV import support
supabase/seed.sql                                      real campuses/categories/ILP notes (no fake data)
src/                                                    React app (Vite + TypeScript)
netlify.toml                                            Netlify build + SPA redirect config
```
