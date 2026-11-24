import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const planLabel = (iep, plan504) => {
  if (iep && plan504) return "IEP & 504";
  if (iep) return "IEP";
  if (plan504) return "504";
  return "None";
};

export const accessLabel = (teacherName, caseManagers) => {
  const parts = [`${teacherName} (Teacher)`];
  caseManagers.forEach((person) => parts.push(`${person.name} (Case Manager)`));
  parts.push("School Administrator");
  return parts.join(", ");
};

const personName = (person, fallback) => person?.name || person?.email || fallback;

export const buildRosterRows = ({ students, directory, assignments }) => {
  const people = new Map();
  (directory || []).forEach((person) => {
    const id = person.user_id || person.id;
    if (id && !people.has(id)) people.set(id, person);
  });

  const managersByStudent = new Map();
  (assignments || []).forEach((row) => {
    const current = managersByStudent.get(row.student_id) || [];
    if (current.some((person) => person.id === row.case_manager_id)) return;
    const person = people.get(row.case_manager_id);
    current.push({ id: row.case_manager_id, name: personName(person, "Case manager") });
    managersByStudent.set(row.student_id, current);
  });

  return (students || [])
    .map((student) => {
      const iep = !!student.iep;
      const plan504 = !!(student.plan_504 || student.plan504);
      const teacher = people.get(student.owner_id);
      const teacherName = personName(teacher, "Classroom teacher");
      const caseManagers = managersByStudent.get(student.id) || [];
      return {
        id: student.id,
        name: student.name || "Student",
        grade: student.grade || "",
        teacherId: student.owner_id || "",
        teacherName,
        iep,
        plan504,
        plan: planLabel(iep, plan504),
        caseManagers,
        unassigned: (iep || plan504) && caseManagers.length === 0,
        access: accessLabel(teacherName, caseManagers),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const filterAdminRoster = (rows, { query = "", teacherId = "all", plan = "all", unassignedOnly = false } = {}) => {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (teacherId !== "all" && row.teacherId !== teacherId) return false;
    if (plan === "iep" && !row.iep) return false;
    if (plan === "504" && !row.plan504) return false;
    if (plan === "none" && (row.iep || row.plan504)) return false;
    if (unassignedOnly && !row.unassigned) return false;
    if (!q) return true;
    return row.name.toLowerCase().includes(q) || row.teacherName.toLowerCase().includes(q);
  });
};

export const teacherOptions = (rows) => {
  const seen = new Map();
  rows.forEach((row) => {
    if (row.teacherId && !seen.has(row.teacherId)) seen.set(row.teacherId, row.teacherName);
  });
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const rosterStudents = (students, teacherId) =>
  (students || []).map((student) => ({
    id: student.id,
    name: student.name,
    grade: student.grade || "",
    owner_id: student.owner_id || student.ownerId || teacherId,
    iep: !!student.iep,
    plan_504: !!(student.plan504 || student.plan_504),
  }));

export const buildStaffSummary = ({ directory, students, assignments }) => {
  const classroomCounts = new Map();
  (students || []).forEach((student) => {
    const ownerId = student.owner_id || student.ownerId;
    if (!ownerId) return;
    classroomCounts.set(ownerId, (classroomCounts.get(ownerId) || 0) + 1);
  });
  const caseloadCounts = new Map();
  (assignments || []).forEach((row) => {
    caseloadCounts.set(row.case_manager_id, (caseloadCounts.get(row.case_manager_id) || 0) + 1);
  });

  return (directory || [])
    .filter((person) => person.access_role === "teacher" || person.access_role === "case_manager")
    .map((person) => {
      const id = person.user_id || person.id;
      const isManager = person.access_role === "case_manager";
      const count = isManager ? caseloadCounts.get(id) || 0 : classroomCounts.get(id) || 0;
      return {
        id,
        name: personName(person, isManager ? "Case manager" : "Teacher"),
        role: person.access_role,
        roleLabel: isManager ? "Case Manager" : "Teacher",
        countLabel: isManager
          ? `${count} on caseload`
          : `${count} student${count === 1 ? "" : "s"}`,
      };
    })
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "teacher" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
};

export const buildCaseloadSummary = (rows) =>
  (rows || [])
    .filter((row) => row.iep || row.plan504)
    .map((row) => ({
      id: row.id,
      name: row.name,
      plan: row.plan,
      managerName: row.caseManagers.map((person) => person.name).join(", "),
      unassigned: row.unassigned,
    }));

export const demoSchoolHome = (students, user) => {
  const teacherId = user?.id || "demo-teacher";
  const managerId = "demo-case-manager";
  const mapped = rosterStudents(students, teacherId);
  const iepStudents = mapped.filter((student) => student.iep || student.plan_504);
  const assignments = iepStudents.slice(0, -1).map((student) => ({
    student_id: student.id,
    case_manager_id: managerId,
  }));
  const directory = [
    {
      user_id: teacherId,
      name: user?.name || "Ms. Sarah Jenkins",
      email: user?.email || "",
      access_role: "teacher",
    },
    {
      user_id: managerId,
      name: "Jordan Hale",
      email: "jordan.hale@school.edu",
      access_role: "case_manager",
    },
  ];
  const rows = buildRosterRows({ students: mapped, directory, assignments });
  return {
    staff: buildStaffSummary({ directory, students: mapped, assignments }),
    caseload: buildCaseloadSummary(rows),
  };
};

export const demoAdminRoster = (students, user) => {
  const teacherId = user?.id || "demo-teacher";
  return buildRosterRows({
    students: rosterStudents(students, teacherId),
    directory: [
      {
        user_id: teacherId,
        name: user?.name || "Teacher",
        email: user?.email || "",
        access_role: "teacher",
      },
    ],
    assignments: [],
  });
};

export const loadSchoolHomeLists = async () => {
  if (!isSupabaseConfigured || !supabase) return { staff: [], caseload: [] };
  const [rosterRes, directoryRes, assignmentRes] = await Promise.all([
    supabase.from("admin_roster").select("id, name, grade, owner_id, iep, plan_504"),
    supabase.rpc("school_directory"),
    supabase.from("caseload_assignments").select("student_id, case_manager_id"),
  ]);
  if (rosterRes.error) throw new Error(rosterRes.error.message);
  if (directoryRes.error) throw new Error(directoryRes.error.message);
  if (assignmentRes.error) throw new Error(assignmentRes.error.message);
  const students = rosterRes.data || [];
  const directory = directoryRes.data || [];
  const assignments = assignmentRes.data || [];
  return {
    staff: buildStaffSummary({ directory, students, assignments }),
    caseload: buildCaseloadSummary(buildRosterRows({ students, directory, assignments })),
  };
};

export const loadAdminRoster = async () => {
  if (!isSupabaseConfigured || !supabase) return [];
  const [rosterRes, directoryRes, assignmentRes] = await Promise.all([
    supabase.from("admin_roster").select("id, name, grade, owner_id, iep, plan_504"),
    supabase.rpc("school_directory"),
    supabase.from("caseload_assignments").select("student_id, case_manager_id"),
  ]);
  if (rosterRes.error) throw new Error(rosterRes.error.message);
  if (directoryRes.error) throw new Error(directoryRes.error.message);
  if (assignmentRes.error) throw new Error(assignmentRes.error.message);
  return buildRosterRows({
    students: rosterRes.data || [],
    directory: directoryRes.data || [],
    assignments: assignmentRes.data || [],
  });
};
