export const ACCESS_ROLES = [
  { id: "teacher", label: "Teacher", hint: "Full access to log, edit and view your roster" },
  { id: "admin", label: "School Administrator", hint: "Read-only analytics and finalized IEP reports" },
  { id: "case_manager", label: "Case Manager / Specialist", hint: "IEP goals and trial logging for your caseload" },
];

const PERMS = {
  teacher: ["log", "log_trials", "edit_student", "add_student", "edit_goals", "settings", "digest", "reset_points", "view_private_notes", "view_students", "export"],
  case_manager: ["log", "log_trials", "edit_goals", "view_students", "export", "add_student", "edit_student", "digest"],
  admin: ["view_students", "export"],
};

export const can = (role, action) => (PERMS[role] || PERMS.teacher).includes(action);

export const roleLabel = (role) => (ACCESS_ROLES.find((r) => r.id === role) || ACCESS_ROLES[0]).label;

export const DEFAULT_PRIVACY_SETTINGS = { adminVisibility: "aggregate" };

export const isAssignedCaseload = (student) =>
  !!student?.assigned || (!student?.ownerId && !!(student?.iep || student?.plan504));

export const isOwnStudent = (student, viewerId) =>
  !!viewerId && student?.ownerId === viewerId && !student?.assigned;

export const scopeStudents = (role, students, viewerId) => {
  if (role !== "case_manager") return students;
  return students.filter((student) => isAssignedCaseload(student) || isOwnStudent(student, viewerId));
};

export const periodIdsOf = (student) =>
  student.periodIds && student.periodIds.length > 0
    ? student.periodIds
    : student.periodId
      ? [student.periodId]
      : [];

export const ownPeriodStudents = (students, classSection, viewerId) =>
  students.filter((student) => {
    if (isOwnStudent(student, viewerId)) return periodIdsOf(student).includes(classSection);
    if (isAssignedCaseload(student)) return (student.pulloutPeriodIds || []).includes(classSection);
    return false;
  });

export const assignedCaseloadStudents = (students) => students.filter((student) => isAssignedCaseload(student));

export const visibleClassroomStudents = (role, students, classSection, viewerId) => {
  if (role === "case_manager") return ownPeriodStudents(students, classSection, viewerId);
  return students.filter((student) => periodIdsOf(student).includes(classSection));
};

export const analyticsStudents = (role, students, classSection, viewerId) => {
  if (role !== "case_manager") return visibleClassroomStudents(role, students, classSection, viewerId);
  const seen = new Set();
  return [...ownPeriodStudents(students, classSection, viewerId), ...assignedCaseloadStudents(students)].filter((student) => {
    if (seen.has(student.id)) return false;
    seen.add(student.id);
    return true;
  });
};

export const decorateCaseloadStudent = (student) => {
  if (!student?.assigned && !student?.ownerId && (student?.iep || student?.plan504)) {
    return { ...student, assigned: true, teacherName: student.teacherName || "Classroom teacher" };
  }
  return student;
};

export const canManageDigest = (role, student, viewerId) => {
  if (!can(role, "digest")) return false;
  if (role !== "case_manager") return true;
  return isOwnStudent(student, viewerId);
};

export const canEditStudentRecord = (role, student, viewerId) => {
  if (!can(role, "edit_student")) return false;
  if (role !== "case_manager") return true;
  return !student?.assigned && !!viewerId && student?.ownerId === viewerId;
};

export const namesHidden = () => false;

// Private reflection notes are visible only to the teacher.
export const visibleNote = (log, role) => (log.notePrivate && !can(role, "view_private_notes") ? "" : log.note || "");
