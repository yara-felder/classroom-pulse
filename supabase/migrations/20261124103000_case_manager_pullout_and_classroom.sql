-- Periods stay on profiles.periods. The owner can already update that row.
-- Pull-out placement records which assigned students a case manager includes
-- in one of their own periods, without changing the classroom teacher's periods.
-- Case managers still insert, update, and delete only students they own.
-- Assigned students and their non-private behavior logs stay readable.
-- behavior_staff_notes stay with the owning teacher.

create table if not exists public.pullout_placements (
  case_manager_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  period_id text not null,
  school_id uuid references public.schools (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (case_manager_id, student_id, period_id),
  constraint pullout_period_id_len check (char_length(period_id) between 1 and 80)
);

create index if not exists pullout_placements_manager_idx
  on public.pullout_placements (case_manager_id);

create or replace function public.guard_pullout_placement()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
begin
  if auth.uid() is null or new.case_manager_id is distinct from auth.uid() then
    raise exception 'Only the signed-in case manager can place this student';
  end if;
  if not public.has_caseload(new.student_id) then
    raise exception 'Only an assigned IEP or 504 student can be added to a pull-out period';
  end if;
  select s.school_id into new.school_id
  from public.students s
  where s.id = new.student_id;
  if new.school_id is null then
    raise exception 'Student has no school';
  end if;
  return new;
end;
$fn$;

drop trigger if exists pullout_placements_guard on public.pullout_placements;
create trigger pullout_placements_guard
  before insert or update on public.pullout_placements
  for each row execute function public.guard_pullout_placement();

alter table public.pullout_placements enable row level security;
alter table public.pullout_placements force row level security;

drop policy if exists pullout_select on public.pullout_placements;
drop policy if exists pullout_insert on public.pullout_placements;
drop policy if exists pullout_delete on public.pullout_placements;

create policy pullout_select on public.pullout_placements
  for select using (case_manager_id = auth.uid());

create policy pullout_insert on public.pullout_placements
  for insert with check (
    case_manager_id = auth.uid()
    and public.has_caseload(student_id)
  );

create policy pullout_delete on public.pullout_placements
  for delete using (case_manager_id = auth.uid());

revoke all on public.pullout_placements from public, anon;
grant select, insert, delete on public.pullout_placements to authenticated;

revoke all on function public.guard_pullout_placement() from public, anon, authenticated;

drop policy if exists students_owner_all on public.students;
drop policy if exists students_owner_select on public.students;
drop policy if exists students_owner_insert on public.students;
drop policy if exists students_owner_update on public.students;
drop policy if exists students_owner_delete on public.students;

create policy students_owner_select on public.students
  for select using (owner_id = auth.uid());

create policy students_owner_insert on public.students
  for insert with check (owner_id = auth.uid());

create policy students_owner_update on public.students
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy students_owner_delete on public.students
  for delete using (owner_id = auth.uid());

drop policy if exists students_caseload_select on public.students;
create policy students_caseload_select on public.students
  for select using (public.has_caseload(id));

drop policy if exists logs_caseload_select on public.behavior_logs;
create policy logs_caseload_select on public.behavior_logs
  for select using (
    public.has_caseload(student_id)
    and note_private = false
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
