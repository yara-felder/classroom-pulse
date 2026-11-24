-- Today's school pulse for administrators.
-- Counts only. No student names, notes, or staff-note rows.

create or replace function public.get_school_today_pulse(
  p_school_id uuid,
  p_day date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $fn$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_school_id is null or p_day is null then
    raise exception 'School and day are required';
  end if;
  if not public.is_school_admin(p_school_id) then
    raise exception 'Only a school administrator can view school analytics';
  end if;

  with teachers as (
    select
      m.user_id,
      coalesce(nullif(btrim(p.name), ''), 'Teacher') as teacher_name,
      coalesce(p.role, '') as teacher_title
    from public.school_memberships m
    join public.profiles p on p.id = m.user_id
    where m.school_id = p_school_id
      and m.access_role = 'teacher'
  ),
  day_logs as (
    select
      b.owner_id,
      b.type,
      nullif(btrim(b.tag), '') as tag,
      case
        when extract(hour from (b.timestamp at time zone 'America/Los_Angeles')) < 11 then 'Morning'
        when extract(hour from (b.timestamp at time zone 'America/Los_Angeles')) < 13 then 'Lunch/Recess'
        else 'Afternoon'
      end as time_block
    from public.behavior_logs b
    where b.school_id = p_school_id
      and b.type in ('positive', 'support')
      and coalesce(b.log_date, (b.timestamp at time zone 'America/Los_Angeles')::date) = p_day
  ),
  blocks as (
    select *
    from (values ('Morning', 1), ('Lunch/Recess', 2), ('Afternoon', 3)) as slot(label, ord)
  ),
  teacher_blocks as (
    select
      t.user_id,
      blocks.label,
      blocks.ord,
      count(day_logs.type) filter (where day_logs.type = 'positive') as positive_count,
      count(day_logs.type) filter (where day_logs.type = 'support') as support_count
    from teachers t
    cross join blocks
    left join day_logs
      on day_logs.owner_id = t.user_id
     and day_logs.time_block = blocks.label
    group by t.user_id, blocks.label, blocks.ord
  ),
  tag_counts as (
    select owner_id, tag, count(*) as n
    from day_logs
    where tag is not null
    group by owner_id, tag
  ),
  top_tags as (
    select
      owner_id,
      tag,
      n,
      row_number() over (partition by owner_id order by n desc, tag) as rn
    from tag_counts
  )
  select coalesce(jsonb_agg(built.classroom order by built.teacher_name), '[]'::jsonb)
  into result
  from (
    select
      t.teacher_name,
      jsonb_build_object(
        'teacher_id', t.user_id,
        'teacher_name', t.teacher_name,
        'teacher_title', t.teacher_title,
        'positive', coalesce((select sum(tb.positive_count) from teacher_blocks tb where tb.user_id = t.user_id), 0),
        'support', coalesce((select sum(tb.support_count) from teacher_blocks tb where tb.user_id = t.user_id), 0),
        'blocks', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'label', tb.label,
            'positive', tb.positive_count,
            'support', tb.support_count
          ) order by tb.ord), '[]'::jsonb)
          from teacher_blocks tb
          where tb.user_id = t.user_id
        ),
        'tags', (
          select coalesce(jsonb_agg(tt.tag order by tt.n desc, tt.tag), '[]'::jsonb)
          from top_tags tt
          where tt.owner_id = t.user_id
            and tt.rn <= 3
        )
      ) as classroom
    from teachers t
  ) built;

  return jsonb_build_object('classrooms', coalesce(result, '[]'::jsonb));
end;
$fn$;

revoke all on function public.get_school_today_pulse(uuid, date) from public, anon, authenticated;
grant execute on function public.get_school_today_pulse(uuid, date) to authenticated;
