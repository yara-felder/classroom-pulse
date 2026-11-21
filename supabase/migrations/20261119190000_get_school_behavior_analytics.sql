-- School-wide weekday totals for an administrator.
-- Returns one row per linked teacher per weekday. No student names or ids.
-- Apply after 20261117204000_lock_down_rls_by_role.sql.

create or replace function public.get_school_behavior_analytics(
  p_school_id uuid,
  p_cycle_start date,
  p_cycle_end date
)
returns table (
  teacher_id uuid,
  teacher_name text,
  teacher_title text,
  weekday date,
  positive_count bigint,
  support_count bigint
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_school_id is null or p_cycle_start is null or p_cycle_end is null then
    raise exception 'School and cycle dates are required';
  end if;
  if p_cycle_end < p_cycle_start then
    raise exception 'Cycle end is before the start';
  end if;
  if p_cycle_end > p_cycle_start + 120 then
    raise exception 'Cycle range is too long';
  end if;
  if not public.is_school_admin(p_school_id) then
    raise exception 'Only a school administrator can view school analytics';
  end if;

  return query
  with days as (
    select d::date as weekday
    from generate_series(p_cycle_start, p_cycle_end, interval '1 day') as d
    where extract(dow from d) between 1 and 5
  ),
  teachers as (
    select
      m.user_id,
      coalesce(nullif(btrim(p.name), ''), 'Teacher') as teacher_name,
      coalesce(p.role, '') as teacher_title
    from public.school_memberships m
    join public.profiles p on p.id = m.user_id
    where m.school_id = p_school_id
      and m.access_role = 'teacher'
  )
  select
    t.user_id,
    t.teacher_name,
    t.teacher_title,
    days.weekday,
    count(b.id) filter (where b.type = 'positive'),
    count(b.id) filter (where b.type = 'support')
  from teachers t
  cross join days
  left join public.behavior_logs b
    on b.owner_id = t.user_id
   and b.school_id = p_school_id
   and (b.timestamp at time zone 'UTC')::date = days.weekday
   and b.type in ('positive', 'support')
  group by t.user_id, t.teacher_name, t.teacher_title, days.weekday
  order by t.teacher_name, days.weekday;
end;
$fn$;

revoke all on function public.get_school_behavior_analytics(uuid, date, date) from public, anon, authenticated;
grant execute on function public.get_school_behavior_analytics(uuid, date, date) to authenticated;
