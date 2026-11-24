-- Case managers send Parent Digests only for students they own.
-- digest_owner_all already allows owner_id = auth.uid() on digest_sends.
-- Assigned caseload students stay with the classroom teacher.

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

  -- Owners send digests for their own students. Assigned case managers do not.
  if not (
    stu.owner_id = auth.uid()
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

drop policy if exists digest_caseload_insert on public.digest_sends;

drop policy if exists digest_owner_all on public.digest_sends;
create policy digest_owner_all on public.digest_sends
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

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

  if tg_op = 'UPDATE'
     and auth.uid() is distinct from old.owner_id
     and public.has_caseload(old.id)
     and not public.is_school_admin(old.school_id)
  then
    raise exception 'Assigned caseload records are managed by the classroom teacher';
  end if;

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

revoke all on function public.build_parent_digest(uuid, jsonb, text, text, text, text) from public, anon, authenticated;
grant execute on function public.build_parent_digest(uuid, jsonb, text, text, text, text) to authenticated;
revoke all on function public.guard_student_row() from public, anon, authenticated;
