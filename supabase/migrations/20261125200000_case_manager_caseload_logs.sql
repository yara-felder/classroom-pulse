-- Case managers can read non-private behavior logs for students on their
-- caseload, including logs written by the classroom teacher.
-- Private reflections stay on logs_owner_all and are not shared here.
-- created_at is only a fallback when a log has no occurred timestamp.

alter table public.behavior_logs
  add column if not exists created_at timestamptz;

update public.behavior_logs
set created_at = "timestamp"
where created_at is null;

alter table public.behavior_logs
  alter column created_at set default now();

alter table public.behavior_logs
  alter column created_at set not null;

create or replace function public.assigned_caseload_student(target_student uuid)
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
    where c.case_manager_id = auth.uid()
      and c.student_id = target_student
  );
$fn$;

revoke all on function public.assigned_caseload_student(uuid) from public, anon, authenticated;
grant execute on function public.assigned_caseload_student(uuid) to authenticated;

drop policy if exists logs_caseload_select on public.behavior_logs;
create policy logs_caseload_select on public.behavior_logs
  for select using (
    note_private = false
    and public.assigned_caseload_student(student_id)
  );

drop function if exists public.caseload_support_context();

create function public.caseload_support_context()
returns table (
  id uuid,
  student_id uuid,
  owner_id uuid,
  type text,
  tag text,
  "timestamp" timestamptz,
  created_at timestamptz,
  log_date date,
  context jsonb,
  notify_parent boolean,
  include_in_digest boolean,
  note_private boolean
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $fn$
  select
    b.id,
    b.student_id,
    b.owner_id,
    b.type,
    b.tag,
    b."timestamp",
    b.created_at,
    b.log_date,
    coalesce(b.context, '{}'::jsonb),
    b.notify_parent,
    b.include_in_digest,
    false as note_private
  from public.behavior_logs b
  where public.assigned_caseload_student(b.student_id)
    and b.note_private = false;
$fn$;

revoke all on function public.caseload_support_context() from public, anon, authenticated;
grant execute on function public.caseload_support_context() to authenticated;
