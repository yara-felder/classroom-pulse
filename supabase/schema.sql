-- Classroom Pulse schema. Run in the Supabase SQL editor.
-- Per-teacher isolation: owner_id = auth.uid() (profiles.id = auth.uid()).
-- Drops leftover tables from a partial run, then creates the full schema.
-- Safe on a new project: there is no classroom data yet.

create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.digest_sends cascade;
drop table if exists public.behavior_logs cascade;
drop table if exists public.skill_goals cascade;
drop table if exists public.iep_goals cascade;
drop table if exists public.teacher_settings cascade;
drop table if exists public.students cascade;
drop table if exists public.profiles cascade;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text not null default '',
  initials text not null default 'U',
  role text not null default '',
  access_role text not null default 'teacher',
  school_name text not null default '',
  school_type text,
  periods jsonb not null default '[]'::jsonb,
  profile_complete boolean not null default false,
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  avatar text,
  grade text,
  period_ids jsonb not null default '[]'::jsonb,
  points int not null default 0,
  lifetime_points int not null default 0,
  support_count int not null default 0,
  recent_tag text,
  status text,
  iep boolean not null default false,
  plan_504 boolean not null default false,
  guardian_name text not null default '',
  guardian_email text not null default '',
  parent_digest_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists students_owner_idx on public.students (owner_id);

create table if not exists public.behavior_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  type text not null,
  tag text,
  note text not null default '',
  note_private boolean not null default false,
  notify_parent boolean not null default false,
  include_in_digest boolean not null default false,
  timestamp timestamptz not null default now()
);

create index if not exists behavior_logs_owner_idx on public.behavior_logs (owner_id);
create index if not exists behavior_logs_student_idx on public.behavior_logs (student_id);

create table if not exists public.skill_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  slug text,
  name text not null,
  progress int not null default 0,
  baseline int not null default 0,
  target_percent int not null default 100,
  target_date date,
  status text,
  last_prompt text,
  trials jsonb not null default '[null,null,null,null,null]'::jsonb,
  trend jsonb not null default '[0,0,0,0,0,0,0]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  mastery jsonb
);

create index if not exists skill_goals_student_idx on public.skill_goals (student_id);

create table if not exists public.iep_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  description text not null default '',
  domain text,
  baseline int,
  target_percent int,
  target_date date,
  review_date date,
  accommodations jsonb not null default '[]'::jsonb,
  linked_skill_slugs jsonb not null default '[]'::jsonb,
  plan_type text,
  trials jsonb not null default '[null,null,null,null,null]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  mastery jsonb
);

create index if not exists iep_goals_student_idx on public.iep_goals (student_id);

create table if not exists public.teacher_settings (
  owner_id uuid primary key references public.profiles (id) on delete cascade,
  digest jsonb not null default '{}'::jsonb,
  points jsonb not null default '{}'::jsonb,
  privacy jsonb not null default '{}'::jsonb,
  checklist jsonb not null default '{}'::jsonb,
  custom_skills jsonb not null default '[]'::jsonb,
  digest_drafts jsonb not null default '{}'::jsonb,
  class_section text,
  updated_at timestamptz not null default now()
);

create table if not exists public.digest_sends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  entry_ids jsonb not null default '[]'::jsonb,
  mode text not null default 'manual',
  html text not null default '',
  edited boolean not null default false,
  sent_at timestamptz not null default now()
);

create index if not exists digest_sends_owner_idx on public.digest_sends (owner_id);

-- Auto-create a blank profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $handle_new_user$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$handle_new_user$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.behavior_logs enable row level security;
alter table public.skill_goals enable row level security;
alter table public.iep_goals enable row level security;
alter table public.teacher_settings enable row level security;
alter table public.digest_sends enable row level security;

-- Recreate policies idempotently
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "students_own" on public.students;
create policy "students_own" on public.students
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "logs_own" on public.behavior_logs;
create policy "logs_own" on public.behavior_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "skills_own" on public.skill_goals;
create policy "skills_own" on public.skill_goals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "iep_own" on public.iep_goals;
create policy "iep_own" on public.iep_goals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "settings_own" on public.teacher_settings;
create policy "settings_own" on public.teacher_settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "digest_sends_own" on public.digest_sends;
create policy "digest_sends_own" on public.digest_sends
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
