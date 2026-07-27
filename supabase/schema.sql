-- =====================================================================
-- Nexora Labs — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`)
--
-- UPGRADING an existing project that already ran an earlier version of this
-- schema (before the tasks.requirements/resources/checklist columns
-- existed)? Run this first, then the rest of the file is safe to re-run:
--   alter table tasks add column if not exists requirements jsonb not null default '[]'::jsonb;
--   alter table tasks add column if not exists resources jsonb not null default '[]'::jsonb;
--   alter table tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- ADMINS  (Malik & Ahmed's accounts get inserted here manually)
-- ---------------------------------------------------------------------
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  title text not null, -- "Founder" / "CEO"
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- DOMAINS  (config/capacity per track)
-- ---------------------------------------------------------------------
create table if not exists domains (
  slug text primary key,
  name text not null,
  max_seats int not null default 56,
  filled_count int not null default 0
);

insert into domains (slug, name, max_seats) values
  ('frontend', 'Frontend Development', 56),
  ('backend', 'Backend Development', 56),
  ('fullstack', 'Full-Stack Web Development', 56),
  ('genai', 'Generative AI', 56),
  ('ml', 'Machine Learning', 56),
  ('automation', 'Automation', 56),
  ('uiux', 'UI/UX Design', 56),
  ('cybersecurity', 'Cybersecurity', 56),
  ('devops', 'DevOps', 56)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- APPLICANTS
-- ---------------------------------------------------------------------
create table if not exists applicants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  domain text not null references domains(slug),
  cv_url text not null,
  status text not null default 'pending' check (status in ('pending','selected','rejected')),
  applied_at timestamptz default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------
-- INTERNS  (created automatically when an applicant is selected)
-- ---------------------------------------------------------------------
create table if not exists interns (
  id uuid primary key references auth.users(id) on delete cascade,
  applicant_id uuid references applicants(id),
  intern_id text unique not null, -- e.g. NXL-2608-0001
  name text not null,
  email text not null,
  domain text not null references domains(slug),
  cohort text not null default 'August 2026',
  start_date date not null default '2026-08-03',
  end_date date not null default '2026-09-03',
  status text not null default 'active' check (status in ('active','completed','dropped')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- TASKS  (seeded separately per domain — see supabase/seed_tasks.sql)
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  domain text not null references domains(slug),
  week_number int not null check (week_number between 1 and 4),
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  requirements jsonb not null default '[]'::jsonb, -- ["req 1", "req 2", ...]
  resources jsonb not null default '[]'::jsonb,     -- ["resource 1", ...]
  checklist jsonb not null default '[]'::jsonb,      -- what the admin checks before approving
  order_index int not null default 0
);

-- ---------------------------------------------------------------------
-- SUBMISSIONS
-- ---------------------------------------------------------------------
create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  intern_id uuid not null references interns(id) on delete cascade,
  task_id uuid not null references tasks(id),
  submission_link text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  unique (intern_id, task_id)
);

-- ---------------------------------------------------------------------
-- BADGES  (one per approved submission)
-- ---------------------------------------------------------------------
create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  intern_id uuid not null references interns(id) on delete cascade,
  task_id uuid not null references tasks(id),
  awarded_at timestamptz default now(),
  unique (intern_id, task_id)
);

-- ---------------------------------------------------------------------
-- PAYMENTS  (quiz-access fee proof)
-- ---------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  intern_id uuid not null references interns(id) on delete cascade,
  screenshot_url text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  submitted_at timestamptz default now(),
  verified_at timestamptz
);

-- ---------------------------------------------------------------------
-- QUIZZES  (one question bank per domain)
-- ---------------------------------------------------------------------
create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  domain text not null unique references domains(slug),
  questions jsonb not null, -- [{ "question": "...", "options": ["a","b","c","d"], "correct_index": 0, "difficulty": "easy"|"hard" }, ...]
  passing_score int not null default 70 -- percent
);

-- ---------------------------------------------------------------------
-- QUIZ ATTEMPTS
-- ---------------------------------------------------------------------
create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  intern_id uuid not null references interns(id) on delete cascade,
  quiz_id uuid not null references quizzes(id),
  score int not null,
  passed boolean not null,
  attempt_number int not null,
  attempted_at timestamptz default now(),
  next_retry_at timestamptz
);

-- ---------------------------------------------------------------------
-- CERTIFICATES
-- ---------------------------------------------------------------------
create table if not exists certificates (
  id uuid primary key default uuid_generate_v4(),
  intern_id uuid not null references interns(id) on delete cascade,
  cert_code text unique not null, -- e.g. NXL-CERT-2026-0001
  domain text not null references domains(slug),
  issued_at timestamptz default now(),
  pdf_url text not null
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table applicants enable row level security;
alter table interns enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;
alter table badges enable row level security;
alter table payments enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;
alter table certificates enable row level security;
alter table domains enable row level security;
alter table admins enable row level security;

-- CRITICAL: admins must be able to read their own row, both for the app's
-- profile check and because every "admins full access X" policy below runs
-- an `exists (select 1 from admins where id = auth.uid())` subquery — with
-- RLS enabled and zero policies on `admins`, that subquery would return
-- nothing for anyone, including real admins, locking everyone out.
create policy "admins can read own row" on admins for select
  to authenticated using (id = auth.uid());

-- anyone can apply (insert) — no login required
create policy "public can apply" on applicants for insert
  with check (true);

-- anyone can read domain seat info (used on the public Tracks page)
create policy "public can read domains" on domains for select
  using (true);

-- tasks are readable by any authenticated intern (content isn't secret)
create policy "interns can read tasks" on tasks for select
  to authenticated using (true);

-- interns can see and manage only their own rows
create policy "interns read own row" on interns for select
  to authenticated using (id = auth.uid());

create policy "interns read own submissions" on submissions for select
  to authenticated using (intern_id = auth.uid());
create policy "interns insert own submissions" on submissions for insert
  to authenticated with check (intern_id = auth.uid());

create policy "interns read own badges" on badges for select
  to authenticated using (intern_id = auth.uid());

create policy "interns read own payments" on payments for select
  to authenticated using (intern_id = auth.uid());
create policy "interns insert own payments" on payments for insert
  to authenticated with check (intern_id = auth.uid());

create policy "interns read own quiz attempts" on quiz_attempts for select
  to authenticated using (intern_id = auth.uid());

create policy "interns read own certificates" on certificates for select
  to authenticated using (intern_id = auth.uid());

-- certificates are publicly readable by cert_code for the public /verify page
create policy "public can verify certificates" on certificates for select
  using (true);

-- admins can read/write everything (checked via the admins table)
create policy "admins full access applicants" on applicants for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access interns" on interns for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access submissions" on submissions for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access payments" on payments for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access quiz_attempts" on quiz_attempts for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access certificates" on certificates for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access tasks" on tasks for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));
create policy "admins full access domains" on domains for all
  to authenticated using (exists (select 1 from admins where id = auth.uid()));

-- Note: the /api serverless functions use the SERVICE ROLE key, which
-- bypasses RLS entirely — that's how admin-approve, quiz grading, and
-- certificate generation are allowed to write across tables safely
-- without needing every possible RLS policy above to be perfectly open.

-- Helper used by /api/admin-approve.js when an applicant is selected
create or replace function increment_filled_count(domain_slug text)
returns void as $$
  update domains set filled_count = filled_count + 1 where slug = domain_slug;
$$ language sql;

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', true, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- CVs: anyone can upload (applying doesn't require login), but only admins
-- can read them back — the app generates short-lived signed URLs for admin
-- viewing rather than exposing CVs publicly.
create policy "public can upload cv" on storage.objects for insert
  with check (bucket_id = 'cvs');

create policy "admins can read cvs" on storage.objects for select
  to authenticated using (
    bucket_id = 'cvs' and exists (select 1 from admins where id = auth.uid())
  );

-- Payment proofs: an intern can upload and read their own; admins can read all.
create policy "authenticated can upload own payment proof" on storage.objects for insert
  to authenticated with check (bucket_id = 'payment-proofs' and owner = auth.uid());

create policy "owner can read own payment proof" on storage.objects for select
  to authenticated using (bucket_id = 'payment-proofs' and owner = auth.uid());

create policy "admins can read payment proofs" on storage.objects for select
  to authenticated using (
    bucket_id = 'payment-proofs' and exists (select 1 from admins where id = auth.uid())
  );

-- Certificates bucket is intentionally public — that's what makes a
-- certificate independently verifiable/downloadable. Only the service role
-- (used inside /api/quiz-submit.js) ever writes to it — no client insert
-- policy is defined, so regular users cannot upload or overwrite certs.
create policy "public can read certificates" on storage.objects for select
  using (bucket_id = 'certificates');
