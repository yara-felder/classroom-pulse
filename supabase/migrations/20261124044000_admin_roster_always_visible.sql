-- School administrators see every student on their school roster.
-- Teacher privacy.adminVisibility no longer hides names.
-- Parent digests stay on admin_can_see_student, which still requires full visibility.
-- Private staff notes and private behavior logs are unchanged.

create or replace function public.admin_can_see_roster(target_student uuid)
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
      and public.is_school_admin(s.school_id)
  );
$fn$;

revoke all on function public.admin_can_see_roster(uuid) from public, anon, authenticated;
grant execute on function public.admin_can_see_roster(uuid) to authenticated;

create or replace view public.admin_roster
with (security_barrier = true, security_invoker = true) as
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
where public.admin_can_see_roster(s.id);

revoke all on public.admin_roster from public, anon;
grant select on public.admin_roster to authenticated;

drop policy if exists students_admin_select on public.students;
create policy students_admin_select on public.students
  for select using (public.admin_can_see_roster(id));
