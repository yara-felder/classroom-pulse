-- Optional classroom context on a support log.
-- Parent digests keep using parent_update only. This column is never copied there.
-- Private reflection notes stay in note / note_private and remain author-only.

alter table public.behavior_logs
  add column if not exists context jsonb not null default '{}'::jsonb;

comment on column public.behavior_logs.context is
  'Plain-language support context: activity, before, helped, and duration. Staff-only. Not sent in Parent Digests.';

-- Case managers can see time, cue, and context for an assigned student.
-- The private reflection note is not returned.
create or replace function public.caseload_support_context()
returns table (
  id uuid,
  student_id uuid,
  owner_id uuid,
  type text,
  tag text,
  "timestamp" timestamptz,
  log_date date,
  context jsonb,
  notify_parent boolean,
  include_in_digest boolean
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
    b.log_date,
    coalesce(b.context, '{}'::jsonb),
    b.notify_parent,
    b.include_in_digest
  from public.behavior_logs b
  where public.has_caseload(b.student_id)
    and b.type in ('positive', 'support');
$fn$;

revoke all on function public.caseload_support_context() from public, anon, authenticated;
grant execute on function public.caseload_support_context() to authenticated;
