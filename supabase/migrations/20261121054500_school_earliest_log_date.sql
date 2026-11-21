-- Earliest school-week anchor for admin behavior analytics.
-- Counts logs owned by linked teachers, using log_date or Pacific local time.

create or replace function public.get_school_earliest_log_date(p_school_id uuid)
returns date
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $fn$
declare
  found date;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_school_id is null then
    raise exception 'School is required';
  end if;
  if not public.is_school_admin(p_school_id) then
    raise exception 'Only a school administrator can view school analytics';
  end if;

  select min(coalesce(b.log_date, (b.timestamp at time zone 'America/Los_Angeles')::date))
  into found
  from public.behavior_logs b
  join public.school_memberships m
    on m.user_id = b.owner_id
   and m.school_id = p_school_id
   and m.access_role = 'teacher'
  where b.school_id = p_school_id;

  return found;
end;
$fn$;

revoke all on function public.get_school_earliest_log_date(uuid) from public, anon, authenticated;
grant execute on function public.get_school_earliest_log_date(uuid) to authenticated;
