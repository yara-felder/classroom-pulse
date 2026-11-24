-- Case managers create and update students they own.
-- They select every student assigned to them, plus that student's non-private logs.
-- Private behavior logs and behavior_staff_notes stay with the owning teacher.

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

drop policy if exists students_caseload_update on public.students;
create policy students_caseload_update on public.students
  for update using (public.has_caseload(id))
  with check (public.has_caseload(id));

drop policy if exists logs_caseload_select on public.behavior_logs;
create policy logs_caseload_select on public.behavior_logs
  for select using (
    public.has_caseload(student_id)
    and note_private = false
  );
