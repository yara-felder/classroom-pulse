export const ACCESS_ROLES = [
  { id: "teacher", label: "Teacher", hint: "Full access to log, edit and view your roster" },
  { id: "admin", label: "School Administrator", hint: "Read-only analytics and finalized IEP reports" },
  { id: "case_manager", label: "Case Manager / Specialist", hint: "IEP goals and trial logging for your caseload" },
];

const PERMS = {
  teacher: ["log", "log_trials", "edit_student", "add_student", "edit_goals", "settings", "digest", "reset_points", "view_private_notes", "view_students", "export"],
  case_manager: ["log_trials", "edit_goals", "view_students", "export"],
  admin: ["view_students", "export"],
};

export const can = (role, action) => (PERMS[role] || PERMS.teacher).includes(action);

export const roleLabel = (role) => (ACCESS_ROLES.find((r) => r.id === role) || ACCESS_ROLES[0]).label;

export const DEFAULT_PRIVACY_SETTINGS = { adminVisibility: "aggregate" };

// Students a role may see by name: case managers see IEP/504 caseload; admins only with Full Roster Access.
export const scopeStudents = (role, students, privacy) => {
  if (role === "case_manager") return students.filter((s) => s.iep || s.plan504);
  if (role === "admin" && privacy.adminVisibility !== "full") return [];
  return students;
};

export const namesHidden = (role, privacy) => role === "admin" && privacy.adminVisibility !== "full";

// Private reflection notes are visible only to the teacher.
export const visibleNote = (log, role) => (log.notePrivate && !can(role, "view_private_notes") ? "" : log.note || "");
