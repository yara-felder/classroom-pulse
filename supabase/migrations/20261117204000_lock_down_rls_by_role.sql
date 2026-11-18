-- Lock staff access down by school and role.
-- Parents do not have accounts and do not log in. They only receive digest email.
-- Does not drop existing rows. Safe to re-run. Does not replace supabase/schema.sql.
-- Apply in the Supabase SQL editor as the migration role. Do not run schema.sql after this.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenant and role. One school per existing profile, even when school_name matches.
-- school_name stays display text. school_memberships.access_role is authoritative.
-- ---------------------------------------------------------------------------

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  school_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.school_memberships (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete restrict,
  access_role text not null default 'teacher',
  created_at timestamptz not null default now(),
  constraint school_memberships_access_role_check
    check (access_role in ('teacher', 'case_manager', 'admin'))
);

create index if not exists school_memberships_school_idx
  on public.school_memberships (school_id);

create table if not exists public.caseload_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete cascade,
  case_manager_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (student_id, case_manager_id)
);

create index if not exists caseload_manager_idx
  on public.caseload_assignments (case_manager_id, school_id);

-- Invite codes move a signed-in staff user onto an existing school_id.
-- They do not create parent accounts.
create table if not exists public.school_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  code text not null unique,
  access_role text not null,
  created_by uuid not null references public.profiles (id),
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint school_invites_role_check
    check (access_role in ('teacher', 'case_manager')),
  constraint school_invites_max_uses_check
    check (max_uses between 1 and 100),
  constraint school_invites_use_count_check
    check (use_count >= 0)
);

create index if not exists school_invites_school_idx
  on public.school_invites (school_id);

create table if not exists public.behavior_staff_notes (
  log_id uuid primary key references public.behavior_logs (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete cascade,
  body text not null,
  updated_at timestamptz not null default now()
);

create index if not exists behavior_staff_notes_student_idx
  on public.behavior_staff_notes (student_id);

alter table public.students add column if not exists school_id uuid;
alter table public.behavior_logs add column if not exists school_id uuid;
alter table public.skill_goals add column if not exists school_id uuid;
alter table public.iep_goals add column if not exists school_id uuid;
alter table public.teacher_settings add column if not exists school_id uuid;
alter table public.digest_sends add column if not exists school_id uuid;
alter table public.behavior_logs add column if not exists parent_update text not null default '';

-- Existing profiles each get their own school. Shared school_name does not merge them.
-- An operator unites a real school later by moving school_memberships.school_id.
-- Until then, admin and case_manager grants apply only inside that one-person school.
do $backfill_schools$
declare
  rec record;
  sid uuid;
  resolved_role text;
begin
  for rec in
    select
      p.id,
      coalesce(p.school_name, '') as school_name,
      p.school_type,
      p.access_role
    from public.profiles p
    where not exists (
      select 1 from public.school_memberships m where m.user_id = p.id
    )
  loop
    resolved_role := case
      when rec.access_role in ('teacher', 'case_manager', 'admin') then rec.access_role
      else 'teacher'
    end;

    insert into public.schools (name, school_type)
    values (rec.school_name, rec.school_type)
    returning id into sid;

    insert into public.school_memberships (user_id, school_id, access_role)
    values (rec.id, sid, resolved_role);
  end loop;
end;
$backfill_schools$;

update public.profiles p
set access_role = m.access_role
from public.school_memberships m
where m.user_id = p.id
  and p.access_role is distinct from m.access_role;

alter table public.profiles drop constraint if exists profiles_access_role_check;
alter table public.profiles
  add constraint profiles_access_role_check
  check (access_role in ('teacher', 'case_manager', 'admin'));

update public.students s
set school_id = m.school_id
from public.school_memberships m
where m.user_id = s.owner_id
  and s.school_id is distinct from m.school_id;

update public.behavior_logs b
set school_id = m.school_id
from public.school_memberships m
where m.user_id = b.owner_id
  and b.school_id is distinct from m.school_id;

update public.skill_goals g
set school_id = m.school_id
from public.school_memberships m
where m.user_id = g.owner_id
  and g.school_id is distinct from m.school_id;

update public.iep_goals g
set school_id = m.school_id
from public.school_memberships m
where m.user_id = g.owner_id
  and g.school_id is distinct from m.school_id;

update public.teacher_settings t
set school_id = m.school_id
from public.school_memberships m
where m.user_id = t.owner_id
  and t.school_id is distinct from m.school_id;

update public.digest_sends d
set school_id = m.school_id
from public.school_memberships m
where m.user_id = d.owner_id
  and d.school_id is distinct from m.school_id;

do $require_school$
begin
  if exists (select 1 from public.students where school_id is null)
    or exists (select 1 from public.behavior_logs where school_id is null)
    or exists (select 1 from public.skill_goals where school_id is null)
    or exists (select 1 from public.iep_goals where school_id is null)
    or exists (select 1 from public.teacher_settings where school_id is null)
    or exists (select 1 from public.digest_sends where school_id is null)
  then
    raise exception 'school_id backfill left nulls; every owner needs a school membership';
  end if;
end;
$require_school$;

-- Parent-visible narrative vs internal note. behavior_logs.note stays for the owning teacher.
update public.behavior_logs
set parent_update = case
  when note_private then ''
  when include_in_digest or notify_parent then coalesce(note, '')
  else ''
end;

delete from public.behavior_staff_notes n
using public.behavior_logs b
where n.log_id = b.id
  and not (
    coalesce(b.note, '') <> ''
    and (
      b.note_private
      or not (b.include_in_digest or b.notify_parent)
    )
  );

insert into public.behavior_staff_notes (log_id, owner_id, school_id, student_id, body)
select b.id, b.owner_id, b.school_id, b.student_id, b.note
from public.behavior_logs b
where coalesce(b.note, '') <> ''
  and (
    b.note_private
    or not (b.include_in_digest or b.notify_parent)
  )
on conflict (log_id) do update
set body = excluded.body,
    owner_id = excluded.owner_id,
    school_id = excluded.school_id,
    student_id = excluded.student_id,
    updated_at = now();

alter table public.behavior_logs drop constraint if exists behavior_logs_private_hides_parent_update;
alter table public.behavior_logs
  add constraint behavior_logs_private_hides_parent_update
  check (note_private = false or parent_update = '');

do $add_fkeys$
begin
  if not exists (select 1 from pg_constraint where conname = 'students_school_id_fkey') then
    alter table public.students
      add constraint students_school_id_fkey
      foreign key (school_id) references public.schools (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'behavior_logs_school_id_fkey') then
    alter table public.behavior_logs
      add constraint behavior_logs_school_id_fkey
      foreign key (school_id) references public.schools (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'skill_goals_school_id_fkey') then
    alter table public.skill_goals
      add constraint skill_goals_school_id_fkey
      foreign key (school_id) references public.schools (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'iep_goals_school_id_fkey') then
    alter table public.iep_goals
      add constraint iep_goals_school_id_fkey
      foreign key (school_id) references public.schools (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'teacher_settings_school_id_fkey') then
    alter table public.teacher_settings
      add constraint teacher_settings_school_id_fkey
      foreign key (school_id) references public.schools (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'digest_sends_school_id_fkey') then
    alter table public.digest_sends
      add constraint digest_sends_school_id_fkey
      foreign key (school_id) references public.schools (id) on delete restrict;
  end if;
end;
$add_fkeys$;

alter table public.students alter column school_id set not null;
alter table public.behavior_logs alter column school_id set not null;
alter table public.skill_goals alter column school_id set not null;
alter table public.iep_goals alter column school_id set not null;
alter table public.teacher_settings alter column school_id set not null;
alter table public.digest_sends alter column school_id set not null;

create index if not exists students_school_idx on public.students (school_id);
create index if not exists behavior_logs_school_idx on public.behavior_logs (school_id);
create index if not exists skill_goals_school_idx on public.skill_goals (school_id);
create index if not exists iep_goals_school_idx on public.iep_goals (school_id);
create index if not exists digest_sends_student_idx on public.digest_sends (student_id);

-- ---------------------------------------------------------------------------
-- Helpers. security definer so policies do not recurse through RLS.
-- Each one keys off auth.uid(). They do not grant a parent session.
-- ---------------------------------------------------------------------------

create or replace function public.is_school_admin(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select exists (
    select 1
    from public.school_memberships m
    where m.user_id = auth.uid()
      and m.school_id = target_school
      and m.access_role = 'admin'
  );
$fn$;

-- Policies must call this instead of selecting school_memberships themselves.
-- A direct subquery re-enters memberships RLS and raises 42P17.
create or replace function public.is_school_member(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select exists (
    select 1
    from public.school_memberships m
    where m.user_id = auth.uid()
      and m.school_id = target_school
  );
$fn$;

create or replace function public.has_caseload(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select exists (
    select 1
    from public.caseload_assignments c
    join public.students s on s.id = c.student_id
    join public.school_memberships m
      on m.user_id = auth.uid()
     and m.school_id = s.school_id
     and m.access_role = 'case_manager'
    where c.case_manager_id = auth.uid()
      and c.student_id = target_student
      and c.school_id = s.school_id
      and (s.iep or s.plan_504)
  );
$fn$;

create or replace function public.admin_can_see_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select exists (
    select 1
    from public.students s
    left join public.teacher_settings ts on ts.owner_id = s.owner_id
    where s.id = target_student
      and public.is_school_admin(s.school_id)
      and coalesce(ts.privacy->>'adminVisibility', 'aggregate') = 'full'
  );
$fn$;

create or replace function public.shares_school_with_admin(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select exists (
    select 1
    from public.school_memberships mine
    join public.school_memberships theirs on theirs.school_id = mine.school_id
    where mine.user_id = auth.uid()
      and mine.access_role = 'admin'
      and theirs.user_id = target_user
  );
$fn$;

create or replace function public.student_owner_if_authorized(target_student uuid)
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select s.owner_id
  from public.students s
  where s.id = target_student
    and (
      s.owner_id = auth.uid()
      or public.has_caseload(s.id)
      or public.is_school_admin(s.school_id)
    );
$fn$;

create or replace function public.can_manage_caseload(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select exists (
    select 1
    from public.students s
    where s.id = target_student
      and (
        s.owner_id = auth.uid()
        or public.is_school_admin(s.school_id)
      )
  );
$fn$;

create or replace function public.admin_school_overview()
returns table (
  school_id uuid,
  staff_count bigint,
  student_count bigint,
  behavior_log_count bigint,
  iep_or_504_student_count bigint,
  digest_send_count bigint
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $fn$
declare
  sid uuid;
begin
  select m.school_id into sid
  from public.school_memberships m
  where m.user_id = auth.uid()
    and m.access_role = 'admin';

  if sid is null then
    raise exception 'Only a school administrator can view school totals';
  end if;

  return query
  select
    sid,
    (select count(*) from public.school_memberships m where m.school_id = sid),
    (select count(*) from public.students s where s.school_id = sid),
    (select count(*) from public.behavior_logs b where b.school_id = sid),
    (select count(*) from public.students s where s.school_id = sid and (s.iep or s.plan_504)),
    (select count(*) from public.digest_sends d where d.school_id = sid);
end;
$fn$;

create or replace function public.set_member_access_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  sid uuid;
  target_sid uuid;
  admin_count integer;
begin
  if new_role not in ('teacher', 'case_manager', 'admin') then
    raise exception 'Role must be teacher, case_manager, or admin';
  end if;

  select m.school_id into sid
  from public.school_memberships m
  where m.user_id = auth.uid()
    and m.access_role = 'admin';

  if sid is null then
    raise exception 'Only a school administrator can assign roles';
  end if;

  select m.school_id into target_sid
  from public.school_memberships m
  where m.user_id = target_user;

  if target_sid is distinct from sid then
    raise exception 'That account is not in your school';
  end if;

  if target_user = auth.uid() and new_role <> 'admin' then
    select count(*) into admin_count
    from public.school_memberships m
    where m.school_id = sid
      and m.access_role = 'admin';
    if admin_count < 2 then
      raise exception 'Assign another administrator before changing your own role';
    end if;
  end if;

  perform set_config('classroom_pulse.allow_role_write', 'on', true);

  update public.school_memberships
  set access_role = new_role
  where user_id = target_user;

  update public.profiles
  set access_role = new_role
  where id = target_user;
end;
$fn$;

create or replace function public.assign_caseload(target_case_manager uuid, target_student uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  stu public.students%rowtype;
  manager_school uuid;
  manager_role text;
begin
  if not public.can_manage_caseload(target_student) then
    raise exception 'Only the owning teacher or a school administrator can assign caseload';
  end if;

  select * into stu from public.students s where s.id = target_student;
  if stu.id is null then
    raise exception 'Student not found';
  end if;
  if not (stu.iep or stu.plan_504) then
    raise exception 'Caseload is limited to students with an IEP or 504 plan';
  end if;

  select m.school_id, m.access_role into manager_school, manager_role
  from public.school_memberships m
  where m.user_id = target_case_manager;

  if manager_role is distinct from 'case_manager' or manager_school is distinct from stu.school_id then
    raise exception 'Case manager must belong to this student''s school';
  end if;

  insert into public.caseload_assignments (school_id, student_id, case_manager_id, assigned_by)
  values (stu.school_id, stu.id, target_case_manager, auth.uid())
  on conflict (student_id, case_manager_id) do nothing;
end;
$fn$;

create or replace function public.unassign_caseload(target_case_manager uuid, target_student uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
begin
  if not public.can_manage_caseload(target_student) then
    raise exception 'Only the owning teacher or a school administrator can change caseload';
  end if;

  delete from public.caseload_assignments
  where case_manager_id = target_case_manager
    and student_id = target_student;
end;
$fn$;

create or replace function public.school_directory()
returns table (
  user_id uuid,
  name text,
  email text,
  access_role text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select p.id, p.name, p.email, m.access_role
  from public.school_memberships mine
  join public.school_memberships m on m.school_id = mine.school_id
  join public.profiles p on p.id = m.user_id
  where mine.user_id = auth.uid();
$fn$;

create or replace function public.create_school_invite(
  new_role text,
  use_limit integer default 1,
  valid_days integer default 14
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  sid uuid;
  invite_code text;
  exp timestamptz;
  uses integer;
  created public.school_invites%rowtype;
begin
  if new_role not in ('teacher', 'case_manager') then
    raise exception 'Invites can add a teacher or a case manager';
  end if;

  uses := least(100, greatest(1, coalesce(use_limit, 1)));
  if valid_days is null or valid_days < 1 or valid_days > 90 then
    raise exception 'Invite lifetime must be between 1 and 90 days';
  end if;

  select m.school_id into sid
  from public.school_memberships m
  where m.user_id = auth.uid()
    and m.access_role = 'admin';

  if sid is null then
    raise exception 'Only a school administrator can invite staff';
  end if;

  invite_code := encode(gen_random_bytes(12), 'hex');
  exp := now() + make_interval(days => valid_days);

  insert into public.school_invites (school_id, code, access_role, created_by, expires_at, max_uses)
  values (sid, invite_code, new_role, auth.uid(), exp, uses)
  returning * into created;

  return jsonb_build_object(
    'id', created.id,
    'code', created.code,
    'access_role', created.access_role,
    'expires_at', created.expires_at,
    'max_uses', created.max_uses
  );
end;
$fn$;

create or replace function public.revoke_school_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  updated integer;
begin
  update public.school_invites i
  set revoked_at = now()
  where i.id = invite_id
    and i.revoked_at is null
    and public.is_school_admin(i.school_id);
  get diagnostics updated = row_count;
  if updated = 0 then
    raise exception 'Invite not found';
  end if;
end;
$fn$;

-- Moves the caller off their personal school onto the inviting admin's school.
-- Classroom rows follow the membership. Caseload rows for the old school are dropped.
create or replace function public.join_school(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  uid uuid := auth.uid();
  inv public.school_invites%rowtype;
  old_sid uuid;
  old_role text;
  admin_count integer;
  member_count integer;
  dest_name text;
  dest_type text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if coalesce(btrim(invite_code), '') = '' then
    raise exception 'Enter an invite code';
  end if;

  select * into inv
  from public.school_invites i
  where i.code = lower(btrim(invite_code))
  for update;

  if not found then
    raise exception 'Invite code is not valid';
  end if;
  if inv.revoked_at is not null or inv.expires_at <= now() or inv.use_count >= inv.max_uses then
    raise exception 'Invite code is no longer active';
  end if;

  select m.school_id, m.access_role into old_sid, old_role
  from public.school_memberships m
  where m.user_id = uid;

  if old_sid is null then
    raise exception 'Your account has no school membership';
  end if;
  if old_sid = inv.school_id then
    raise exception 'You are already in this school';
  end if;

  if old_role = 'admin' then
    select count(*) into admin_count
    from public.school_memberships m
    where m.school_id = old_sid
      and m.access_role = 'admin';
    select count(*) into member_count
    from public.school_memberships m
    where m.school_id = old_sid;
    if admin_count < 2 and member_count > 1 then
      raise exception 'Assign another administrator before leaving this school';
    end if;
  end if;

  select s.name, s.school_type into dest_name, dest_type
  from public.schools s
  where s.id = inv.school_id;

  perform set_config('classroom_pulse.allow_role_write', 'on', true);

  update public.school_memberships
  set school_id = inv.school_id,
      access_role = inv.access_role
  where user_id = uid;

  update public.profiles
  set access_role = inv.access_role,
      school_name = coalesce(dest_name, ''),
      school_type = dest_type
  where id = uid;

  update public.students set school_id = inv.school_id where owner_id = uid;
  update public.behavior_logs set school_id = inv.school_id where owner_id = uid;
  update public.behavior_staff_notes set school_id = inv.school_id where owner_id = uid;
  update public.skill_goals set school_id = inv.school_id where owner_id = uid;
  update public.iep_goals set school_id = inv.school_id where owner_id = uid;
  update public.teacher_settings set school_id = inv.school_id where owner_id = uid;
  update public.digest_sends set school_id = inv.school_id where owner_id = uid;

  update public.caseload_assignments c
  set school_id = inv.school_id
  from public.students s
  where c.student_id = s.id
    and s.owner_id = uid;

  delete from public.caseload_assignments
  where case_manager_id = uid
    and school_id is distinct from inv.school_id;

  update public.school_invites
  set use_count = use_count + 1
  where id = inv.id;

  delete from public.schools s
  where s.id = old_sid
    and not exists (select 1 from public.school_memberships m where m.school_id = s.id)
    and not exists (select 1 from public.students st where st.school_id = s.id);

  return inv.school_id;
end;
$fn$;

-- Updates only the two delivery columns. Used by the owning teacher, an assigned
-- case manager, or a same-school admin (including aggregate admins, who cannot select the row).
create or replace function public.set_guardian_delivery(
  target_student uuid,
  new_guardian_email text,
  new_parent_digest_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
begin
  if not exists (
    select 1
    from public.students s
    where s.id = target_student
      and (
        s.owner_id = auth.uid()
        or public.has_caseload(s.id)
        or public.is_school_admin(s.school_id)
      )
  ) then
    raise exception 'Not allowed to update guardian delivery for this student';
  end if;

  update public.students
  set guardian_email = coalesce(new_guardian_email, ''),
      parent_digest_enabled = coalesce(new_parent_digest_enabled, true)
  where id = target_student;
end;
$fn$;

create or replace function public.try_uuid(val text)
returns uuid
language plpgsql
immutable
set search_path = public
as $fn$
begin
  return val::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$fn$;

create or replace function public.html_escape(val text)
returns text
language sql
immutable
set search_path = public
as $fn$
  select replace(
    replace(
      replace(
        replace(
          replace(coalesce(val, ''), '&', '&amp;'),
          '<', '&lt;'
        ),
        '>', '&gt;'
      ),
      '"', '&quot;'
    ),
    '''', '&#39;'
  );
$fn$;

create or replace function public.digest_paragraphs(val text)
returns text
language sql
immutable
set search_path = public
as $fn$
  select coalesce(string_agg(
    '<p style="margin:0 0 6px">' || public.html_escape(btrim(line)) || '</p>',
    ''
  ), '')
  from regexp_split_to_table(coalesce(val, ''), E'\n+') as line
  where btrim(line) <> '';
$fn$;

create or replace function public.digest_section(title text, body text)
returns text
language sql
immutable
set search_path = public
as $fn$
  select case
    when btrim(coalesce(body, '')) = '' then ''
    else '<h3 style="margin:16px 0 6px;font-size:15px">'
      || public.html_escape(title)
      || '</h3>'
      || public.digest_paragraphs(body)
  end;
$fn$;

-- Builds one student's parent email from approved logs. Ignores client HTML.
-- Narrative comes from parent_update only, which the log trigger clears when note_private.
create or replace function public.build_parent_digest(
  target_student uuid,
  entry_ids jsonb,
  personal_note text default '',
  intro text default '',
  home_connection text default '',
  footer text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  stu public.students%rowtype;
  first_name text;
  salutation text;
  note_text text;
  home_text text;
  footer_text text;
  intro_text text;
  blob text;
  celebrations text := '';
  support_notes text := '';
  mastered text := '';
  line text;
  html text;
  clean_ids jsonb;
  rec record;
  ferpa text := 'CONFIDENTIAL: This document contains personally identifiable student education records protected under the Family Educational Rights and Privacy Act (FERPA, 20 U.S.C. § 1232g; 34 CFR Part 99). Do not redistribute or disclose without authorization.';
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into stu from public.students s where s.id = target_student;
  if stu.id is null then
    raise exception 'Student not found';
  end if;

  if not (
    stu.owner_id = auth.uid()
    or public.has_caseload(stu.id)
    or public.admin_can_see_student(stu.id)
  ) then
    raise exception 'Not allowed to send a digest for this student';
  end if;

  if stu.parent_digest_enabled = false then
    raise exception 'Parent digest is turned off for this student';
  end if;
  if coalesce(btrim(stu.guardian_email), '') = '' then
    raise exception 'Add a guardian email first';
  end if;

  if entry_ids is null or jsonb_typeof(entry_ids) <> 'array' or jsonb_array_length(entry_ids) = 0 then
    raise exception 'entry_ids must list this student''s approved updates';
  end if;

  select coalesce(jsonb_agg(distinct id), '[]'::jsonb)
  into clean_ids
  from (
    select public.try_uuid(e.val) as id
    from jsonb_array_elements_text(entry_ids) as e(val)
  ) parsed
  where id is not null;

  if exists (
    select 1
    from jsonb_array_elements_text(entry_ids) as e(val)
    where public.try_uuid(e.val) is null
       or not exists (
         select 1
         from public.behavior_logs bl
         where bl.id = public.try_uuid(e.val)
           and bl.student_id = stu.id
           and bl.include_in_digest
       )
  ) then
    raise exception 'entry_ids must be approved behavior logs for this student only';
  end if;

  note_text := coalesce(personal_note, '');
  intro_text := coalesce(intro, '');
  home_text := coalesce(home_connection, '');
  footer_text := coalesce(footer, '');
  blob := concat_ws(E'\n', note_text, intro_text, home_text, footer_text);

  if exists (
    select 1
    from public.behavior_staff_notes n
    where n.student_id = stu.id
      and length(btrim(n.body)) >= 12
      and (
        strpos(blob, n.body) > 0
        or strpos(blob, public.html_escape(n.body)) > 0
      )
  ) then
    raise exception 'Parent digest cannot include an internal staff note';
  end if;

  if exists (
    select 1
    from public.behavior_logs bl
    where bl.student_id = stu.id
      and bl.note_private
      and length(btrim(coalesce(bl.note, ''))) >= 12
      and (
        strpos(blob, bl.note) > 0
        or strpos(blob, public.html_escape(bl.note)) > 0
      )
  ) then
    raise exception 'Parent digest cannot include a private staff note';
  end if;

  if exists (
    select 1
    from public.students other
    where other.school_id = stu.school_id
      and other.id <> stu.id
      and length(btrim(other.name)) >= 8
      and strpos(lower(blob), lower(btrim(other.name))) > 0
  ) then
    raise exception 'Parent digest text cannot name another student';
  end if;

  first_name := split_part(coalesce(nullif(btrim(stu.name), ''), 'your child'), ' ', 1);
  if coalesce(btrim(stu.guardian_name), '') <> '' then
    salutation := 'Hi ' || btrim(stu.guardian_name) || ',';
  else
    salutation := 'Hi ' || first_name || '''s family,';
  end if;

  if btrim(intro_text) = '' then
    intro_text := 'Here is your weekly Classroom Pulse update for ' || first_name
      || '! We use this tool to share real-time skill growth, celebrate wins, and keep home-to-school communication transparent.';
  end if;
  if btrim(home_text) = '' then
    home_text := 'Want to chat about the school week? Ask ' || first_name
      || ' to share one thing they were proud of working on this week!';
  end if;
  if btrim(footer_text) = '' then
    footer_text := 'Thanks for partnering with us. Reply to this email anytime; it goes straight to your teacher.';
  end if;

  for rec in
    select bl.type, bl.tag, bl.parent_update, bl.note_private, bl.timestamp
    from jsonb_array_elements_text(clean_ids) as e(val)
    join public.behavior_logs bl on bl.id = public.try_uuid(e.val)
    where bl.student_id = stu.id
    order by bl.timestamp
  loop
    if rec.type = 'positive' then
      line := '• ' || to_char(rec.timestamp, 'Dy') || ': ' || coalesce(nullif(btrim(rec.tag), ''), 'Update');
      if rec.note_private = false and coalesce(btrim(rec.parent_update), '') <> '' then
        line := line || ': ' || rec.parent_update;
      end if;
      celebrations := celebrations || line || E'\n';
    else
      line := '• ' || to_char(rec.timestamp, 'Dy') || ' · ' || coalesce(nullif(btrim(rec.tag), ''), 'Support');
      if rec.note_private = false and coalesce(btrim(rec.parent_update), '') <> '' then
        line := line || ': ' || rec.parent_update;
      end if;
      support_notes := support_notes || line || E'\n';
    end if;
  end loop;

  if btrim(celebrations) = '' then
    celebrations := first_name || ' had a steady week! Specific celebration notes will appear here as they are logged.';
  end if;
  if btrim(support_notes) = '' then
    support_notes := 'No support strategies or cues needed to be flagged this week!';
  end if;

  select string_agg('• ' || sk.name || ' (Skill)', E'\n' order by sk.name)
  into mastered
  from public.skill_goals sk
  where sk.student_id = stu.id
    and sk.status = 'Mastered';

  if coalesce(btrim(mastered), '') = '' then
    mastered := 'Actively working on core learning goals and daily routines.';
  end if;

  html :=
    '<div style="font-family:Arial,sans-serif;color:#1e293b;font-size:14px;line-height:1.5">'
    || '<h2 style="margin:0 0 8px;font-size:18px">' || public.html_escape(salutation) || '</h2>'
    || case when btrim(note_text) <> '' then '<div style="margin:0 0 12px">' || public.digest_paragraphs(note_text) || '</div>' else '' end
    || public.digest_paragraphs(intro_text)
    || public.digest_section('Celebrations', celebrations)
    || public.digest_section('Mastered skill highlights', mastered)
    || public.digest_section('Support notes', support_notes)
    || '<div style="margin:16px 0;padding:12px;background:#fffbeb;border-radius:8px"><b>Parent Connection:</b> '
    || public.html_escape(home_text) || '</div>'
    || '<div style="color:#64748b;font-size:12px">' || public.digest_paragraphs(footer_text) || '</div>'
    || '<p style="color:#94a3b8;font-size:10px">' || public.html_escape(ferpa) || '</p>'
    || '</div>';

  return jsonb_build_object(
    'html', html,
    'entry_ids', clean_ids,
    'student_id', stu.id,
    'owner_id', stu.owner_id,
    'school_id', stu.school_id,
    'guardian_email', stu.guardian_email,
    'student_name', stu.name
  );
end;
$fn$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_access_role()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if tg_op = 'INSERT'
     and coalesce(current_setting('classroom_pulse.allow_role_write', true), '') is distinct from 'on'
     and new.access_role is distinct from 'teacher'
  then
    new.access_role := 'teacher';
  end if;

  if tg_op = 'UPDATE'
     and new.access_role is distinct from old.access_role
     and coalesce(current_setting('classroom_pulse.allow_role_write', true), '') is distinct from 'on'
  then
    new.access_role := old.access_role;
  end if;

  return new;
end;
$fn$;

drop trigger if exists profiles_protect_access_role on public.profiles;
create trigger profiles_protect_access_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_access_role();

-- Sole teacher of a personal school may rename that label. This does not move membership.
create or replace function public.sync_school_label()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
begin
  update public.schools s
  set name = coalesce(new.school_name, ''),
      school_type = new.school_type
  from public.school_memberships m
  where m.user_id = new.id
    and m.school_id = s.id
    and m.access_role = 'teacher'
    and (
      select count(*) from public.school_memberships m2 where m2.school_id = s.id
    ) = 1;
  return new;
end;
$fn$;

drop trigger if exists profiles_sync_school_label on public.profiles;
create trigger profiles_sync_school_label
  after insert or update of school_name, school_type on public.profiles
  for each row execute function public.sync_school_label();

create or replace function public.guard_student_row()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  sid uuid;
begin
  if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'id cannot be changed';
  end if;

  select m.school_id into sid
  from public.school_memberships m
  where m.user_id = new.owner_id;

  if sid is null then
    raise exception 'Owner has no school membership';
  end if;
  new.school_id := sid;

  -- Admins may update guardian delivery fields only. Case managers update the assigned row.
  if tg_op = 'UPDATE'
     and auth.uid() is distinct from old.owner_id
     and public.is_school_admin(old.school_id)
     and not public.has_caseload(old.id)
  then
    new.name := old.name;
    new.avatar := old.avatar;
    new.grade := old.grade;
    new.period_ids := old.period_ids;
    new.points := old.points;
    new.lifetime_points := old.lifetime_points;
    new.support_count := old.support_count;
    new.recent_tag := old.recent_tag;
    new.status := old.status;
    new.iep := old.iep;
    new.plan_504 := old.plan_504;
    new.guardian_name := old.guardian_name;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$fn$;

drop trigger if exists students_guard on public.students;
create trigger students_guard
  before insert or update on public.students
  for each row execute function public.guard_student_row();

create or replace function public.guard_owned_row()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  sid uuid;
  student_owner uuid;
begin
  if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;

  select m.school_id into sid
  from public.school_memberships m
  where m.user_id = new.owner_id;

  if sid is null then
    raise exception 'Owner has no school membership';
  end if;
  new.school_id := sid;

  if tg_table_name <> 'teacher_settings' then
    select s.owner_id into student_owner
    from public.students s
    where s.id = new.student_id;

    if student_owner is null or student_owner is distinct from new.owner_id then
      raise exception 'student_id does not belong to this owner';
    end if;
  end if;

  if tg_table_name = 'behavior_staff_notes' then
    if not exists (
      select 1
      from public.behavior_logs bl
      where bl.id = new.log_id
        and bl.owner_id = new.owner_id
        and bl.student_id = new.student_id
    ) then
      raise exception 'staff note does not match the behavior log';
    end if;
  end if;

  if tg_table_name = 'behavior_logs' then
    if new.note_private
       or not (coalesce(new.include_in_digest, false) or coalesce(new.notify_parent, false))
    then
      new.parent_update := '';
    else
      new.parent_update := coalesce(new.note, '');
    end if;
  end if;

  return new;
end;
$fn$;

drop trigger if exists behavior_logs_guard on public.behavior_logs;
create trigger behavior_logs_guard
  before insert or update on public.behavior_logs
  for each row execute function public.guard_owned_row();

drop trigger if exists skill_goals_guard on public.skill_goals;
create trigger skill_goals_guard
  before insert or update on public.skill_goals
  for each row execute function public.guard_owned_row();

drop trigger if exists iep_goals_guard on public.iep_goals;
create trigger iep_goals_guard
  before insert or update on public.iep_goals
  for each row execute function public.guard_owned_row();

drop trigger if exists teacher_settings_guard on public.teacher_settings;
create trigger teacher_settings_guard
  before insert or update on public.teacher_settings
  for each row execute function public.guard_owned_row();

drop trigger if exists digest_sends_guard_owner on public.digest_sends;
create trigger digest_sends_guard_owner
  before insert or update on public.digest_sends
  for each row execute function public.guard_owned_row();

drop trigger if exists behavior_staff_notes_guard on public.behavior_staff_notes;
create trigger behavior_staff_notes_guard
  before insert or update on public.behavior_staff_notes
  for each row execute function public.guard_owned_row();

create or replace function public.sync_behavior_staff_note()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
begin
  if coalesce(new.parent_update, '') <> '' and new.note_private = false then
    delete from public.behavior_staff_notes where log_id = new.id;
  elsif coalesce(new.note, '') <> '' then
    insert into public.behavior_staff_notes (log_id, owner_id, school_id, student_id, body)
    values (new.id, new.owner_id, new.school_id, new.student_id, new.note)
    on conflict (log_id) do update
    set body = excluded.body,
        owner_id = excluded.owner_id,
        school_id = excluded.school_id,
        student_id = excluded.student_id,
        updated_at = now();
  else
    delete from public.behavior_staff_notes where log_id = new.id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists behavior_logs_sync_staff_note on public.behavior_logs;
create trigger behavior_logs_sync_staff_note
  after insert or update on public.behavior_logs
  for each row execute function public.sync_behavior_staff_note();

-- Reject digest HTML that carries an internal note, and entry ids from another student.
-- security definer: case managers and admins cannot select behavior_logs or staff notes,
-- but the check still has to see those rows. The exception text does not return the note.
create or replace function public.digest_send_guard()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
begin
  if new.entry_ids is null then
    new.entry_ids := '[]'::jsonb;
  end if;
  if jsonb_typeof(new.entry_ids) <> 'array' then
    raise exception 'entry_ids must be a json array of behavior log ids';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(new.entry_ids) as e(val)
    where public.try_uuid(e.val) is null
       or not exists (
         select 1
         from public.behavior_logs bl
         where bl.id = public.try_uuid(e.val)
           and bl.student_id = new.student_id
       )
  ) then
    raise exception 'entry_ids must be behavior logs for this student';
  end if;

  if exists (
    select 1
    from public.behavior_staff_notes n
    where n.student_id = new.student_id
      and length(n.body) >= 12
      and (
        strpos(coalesce(new.html, ''), n.body) > 0
        or strpos(coalesce(new.html, ''), public.html_escape(n.body)) > 0
      )
  ) then
    raise exception 'Parent digest cannot include an internal staff note';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(new.entry_ids) as e(val)
    join public.behavior_logs bl on bl.id = public.try_uuid(e.val)
    where bl.student_id = new.student_id
      and bl.note_private
      and length(coalesce(bl.note, '')) > 0
      and (
        strpos(coalesce(new.html, ''), bl.note) > 0
        or strpos(coalesce(new.html, ''), public.html_escape(bl.note)) > 0
      )
  ) then
    raise exception 'Parent digest cannot include a private staff note';
  end if;

  return new;
end;
$fn$;

drop trigger if exists digest_sends_guard_content on public.digest_sends;
create trigger digest_sends_guard_content
  before insert or update on public.digest_sends
  for each row execute function public.digest_send_guard();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  sid uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  if not exists (
    select 1 from public.school_memberships m where m.user_id = new.id
  ) then
    insert into public.schools (name)
    values ('')
    returning id into sid;

    insert into public.school_memberships (user_id, school_id, access_role)
    values (new.id, sid, 'teacher');
  end if;

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Roster view for admins when that teacher opted into full visibility.
-- Default privacy is aggregate: admin_school_overview returns counts only.
-- security_invoker false: the WHERE clause is the authorization check.
-- ---------------------------------------------------------------------------

create or replace view public.admin_roster
with (security_barrier = true, security_invoker = false) as
select
  s.id,
  s.school_id,
  s.owner_id,
  s.name,
  s.grade,
  s.period_ids,
  s.points,
  s.lifetime_points,
  s.support_count,
  s.status,
  s.iep,
  s.plan_504,
  s.guardian_name,
  s.guardian_email,
  s.parent_digest_enabled
from public.students s
where public.admin_can_see_student(s.id);

-- ---------------------------------------------------------------------------
-- RLS. Owner policies stay. Same-school grants are explicit. No parent policies.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.schools enable row level security;
alter table public.schools force row level security;
alter table public.school_memberships enable row level security;
alter table public.school_memberships force row level security;
alter table public.caseload_assignments enable row level security;
alter table public.caseload_assignments force row level security;
alter table public.students enable row level security;
alter table public.students force row level security;
alter table public.behavior_logs enable row level security;
alter table public.behavior_logs force row level security;
alter table public.behavior_staff_notes enable row level security;
alter table public.behavior_staff_notes force row level security;
alter table public.skill_goals enable row level security;
alter table public.skill_goals force row level security;
alter table public.iep_goals enable row level security;
alter table public.iep_goals force row level security;
alter table public.teacher_settings enable row level security;
alter table public.teacher_settings force row level security;
alter table public.digest_sends enable row level security;
alter table public.digest_sends force row level security;
alter table public.school_invites enable row level security;
alter table public.school_invites force row level security;

drop policy if exists "profiles_own" on public.profiles;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.shares_school_with_admin(id)
  );

create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_own on public.profiles
  for delete using (id = auth.uid());

drop policy if exists schools_select_member on public.schools;
drop policy if exists schools_update_admin on public.schools;

create policy schools_select_member on public.schools
  for select using (public.is_school_member(schools.id));

create policy schools_update_admin on public.schools
  for update using (public.is_school_admin(schools.id))
  with check (public.is_school_admin(schools.id));

drop policy if exists memberships_select on public.school_memberships;

create policy memberships_select on public.school_memberships
  for select using (
    user_id = auth.uid()
    or public.is_school_admin(school_id)
  );

drop policy if exists caseload_select on public.caseload_assignments;

create policy caseload_select on public.caseload_assignments
  for select using (
    case_manager_id = auth.uid()
    or public.is_school_admin(school_id)
    or exists (
      select 1
      from public.students s
      where s.id = caseload_assignments.student_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "students_own" on public.students;
drop policy if exists students_owner_all on public.students;
drop policy if exists students_caseload_select on public.students;
drop policy if exists students_caseload_update on public.students;
drop policy if exists students_admin_update on public.students;

create policy students_owner_all on public.students
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy students_caseload_select on public.students
  for select using (public.has_caseload(id));

create policy students_caseload_update on public.students
  for update using (public.has_caseload(id))
  with check (public.has_caseload(id));

create policy students_admin_update on public.students
  for update using (public.is_school_admin(school_id))
  with check (public.is_school_admin(school_id));

drop policy if exists "logs_own" on public.behavior_logs;
drop policy if exists logs_owner_all on public.behavior_logs;

create policy logs_owner_all on public.behavior_logs
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Official, non-private logs for an assigned IEP/504 student. Private rows stay
-- owner-only. behavior_staff_notes has no case-manager policy.
drop policy if exists logs_caseload_select on public.behavior_logs;
create policy logs_caseload_select on public.behavior_logs
  for select using (
    public.has_caseload(student_id)
    and note_private = false
  );

drop policy if exists staff_notes_owner_all on public.behavior_staff_notes;

create policy staff_notes_owner_all on public.behavior_staff_notes
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "skills_own" on public.skill_goals;
drop policy if exists skills_owner_all on public.skill_goals;
drop policy if exists skills_caseload_select on public.skill_goals;
drop policy if exists skills_caseload_insert on public.skill_goals;
drop policy if exists skills_caseload_update on public.skill_goals;

create policy skills_owner_all on public.skill_goals
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy skills_caseload_select on public.skill_goals
  for select using (public.has_caseload(student_id));

create policy skills_caseload_insert on public.skill_goals
  for insert with check (
    public.has_caseload(student_id)
    and owner_id = public.student_owner_if_authorized(student_id)
  );

create policy skills_caseload_update on public.skill_goals
  for update using (public.has_caseload(student_id))
  with check (
    public.has_caseload(student_id)
    and owner_id = public.student_owner_if_authorized(student_id)
  );

drop policy if exists "iep_own" on public.iep_goals;
drop policy if exists iep_owner_all on public.iep_goals;
drop policy if exists iep_caseload_select on public.iep_goals;
drop policy if exists iep_caseload_insert on public.iep_goals;
drop policy if exists iep_caseload_update on public.iep_goals;

create policy iep_owner_all on public.iep_goals
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy iep_caseload_select on public.iep_goals
  for select using (public.has_caseload(student_id));

create policy iep_caseload_insert on public.iep_goals
  for insert with check (
    public.has_caseload(student_id)
    and owner_id = public.student_owner_if_authorized(student_id)
  );

create policy iep_caseload_update on public.iep_goals
  for update using (public.has_caseload(student_id))
  with check (
    public.has_caseload(student_id)
    and owner_id = public.student_owner_if_authorized(student_id)
  );

drop policy if exists "settings_own" on public.teacher_settings;
drop policy if exists settings_owner_all on public.teacher_settings;

create policy settings_owner_all on public.teacher_settings
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "digest_sends_own" on public.digest_sends;
drop policy if exists digest_owner_all on public.digest_sends;
drop policy if exists digest_caseload_select on public.digest_sends;
drop policy if exists digest_caseload_insert on public.digest_sends;
drop policy if exists digest_admin_select on public.digest_sends;
drop policy if exists digest_admin_insert on public.digest_sends;

create policy digest_owner_all on public.digest_sends
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy digest_caseload_select on public.digest_sends
  for select using (public.has_caseload(student_id));

create policy digest_caseload_insert on public.digest_sends
  for insert with check (
    public.has_caseload(student_id)
    and owner_id = public.student_owner_if_authorized(student_id)
  );

create policy digest_admin_select on public.digest_sends
  for select using (public.admin_can_see_student(student_id));

create policy digest_admin_insert on public.digest_sends
  for insert with check (
    public.admin_can_see_student(student_id)
    and owner_id = public.student_owner_if_authorized(student_id)
  );

drop policy if exists invites_admin_select on public.school_invites;
create policy invites_admin_select on public.school_invites
  for select using (public.is_school_admin(school_id));

-- ---------------------------------------------------------------------------
-- Grants. GRANT ALL had included TRUNCATE, which ignores row level security.
-- Trigger functions are not executable by the API roles.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.schools,
  public.school_memberships,
  public.caseload_assignments,
  public.students,
  public.behavior_logs,
  public.behavior_staff_notes,
  public.skill_goals,
  public.iep_goals,
  public.teacher_settings,
  public.digest_sends,
  public.school_invites
to authenticated;

grant select on public.admin_roster to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.is_school_admin(uuid) from public, anon, authenticated;
revoke all on function public.is_school_member(uuid) from public, anon, authenticated;
revoke all on function public.has_caseload(uuid) from public, anon, authenticated;
revoke all on function public.admin_can_see_student(uuid) from public, anon, authenticated;
revoke all on function public.shares_school_with_admin(uuid) from public, anon, authenticated;
revoke all on function public.student_owner_if_authorized(uuid) from public, anon, authenticated;
revoke all on function public.can_manage_caseload(uuid) from public, anon, authenticated;
revoke all on function public.admin_school_overview() from public, anon, authenticated;
revoke all on function public.set_member_access_role(uuid, text) from public, anon, authenticated;
revoke all on function public.assign_caseload(uuid, uuid) from public, anon, authenticated;
revoke all on function public.unassign_caseload(uuid, uuid) from public, anon, authenticated;
revoke all on function public.set_guardian_delivery(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.school_directory() from public, anon, authenticated;
revoke all on function public.create_school_invite(text, integer, integer) from public, anon, authenticated;
revoke all on function public.revoke_school_invite(uuid) from public, anon, authenticated;
revoke all on function public.join_school(text) from public, anon, authenticated;
revoke all on function public.build_parent_digest(uuid, jsonb, text, text, text, text) from public, anon, authenticated;
revoke all on function public.digest_paragraphs(text) from public, anon, authenticated;
revoke all on function public.digest_section(text, text) from public, anon, authenticated;
revoke all on function public.try_uuid(text) from public, anon, authenticated;
revoke all on function public.html_escape(text) from public, anon, authenticated;
revoke all on function public.protect_profile_access_role() from public, anon, authenticated;
revoke all on function public.sync_school_label() from public, anon, authenticated;
revoke all on function public.guard_student_row() from public, anon, authenticated;
revoke all on function public.guard_owned_row() from public, anon, authenticated;
revoke all on function public.sync_behavior_staff_note() from public, anon, authenticated;
revoke all on function public.digest_send_guard() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.is_school_admin(uuid) to authenticated;
grant execute on function public.is_school_member(uuid) to authenticated;
grant execute on function public.has_caseload(uuid) to authenticated;
grant execute on function public.admin_can_see_student(uuid) to authenticated;
grant execute on function public.shares_school_with_admin(uuid) to authenticated;
grant execute on function public.student_owner_if_authorized(uuid) to authenticated;
grant execute on function public.can_manage_caseload(uuid) to authenticated;
grant execute on function public.admin_school_overview() to authenticated;
grant execute on function public.set_member_access_role(uuid, text) to authenticated;
grant execute on function public.assign_caseload(uuid, uuid) to authenticated;
grant execute on function public.unassign_caseload(uuid, uuid) to authenticated;
grant execute on function public.set_guardian_delivery(uuid, text, boolean) to authenticated;
grant execute on function public.school_directory() to authenticated;
grant execute on function public.create_school_invite(text, integer, integer) to authenticated;
grant execute on function public.revoke_school_invite(uuid) to authenticated;
grant execute on function public.join_school(text) to authenticated;
grant execute on function public.build_parent_digest(uuid, jsonb, text, text, text, text) to authenticated;
