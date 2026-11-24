import { supabase } from "@/lib/supabase";

const throwIf = (error) => {
  if (error) throw new Error(error.message);
};

export const mapProfile = (row, email) => ({
  id: row.id,
  email: row.email || email || "",
  name: row.name || "",
  initials: row.initials || "U",
  role: row.role || "",
  accessRole: row.access_role || "teacher",
  schoolName: row.school_name || "",
  schoolType: row.school_type || null,
  periods: Array.isArray(row.periods) ? row.periods : [],
  profileComplete: !!row.profile_complete,
  onboardingComplete: !!row.onboarding_complete,
  isDemo: false,
});

export const profileToRow = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name || "",
  initials: user.initials || "U",
  role: user.role || "",
  access_role: user.accessRole || "teacher",
  school_name: user.schoolName || "",
  school_type: user.schoolType || null,
  periods: user.periods || [],
  profile_complete: !!user.profileComplete,
  onboarding_complete: !!user.onboardingComplete,
  updated_at: new Date().toISOString(),
});

export const mapStudent = (row) => ({
  id: row.id,
  name: row.name,
  avatar: null,
  grade: row.grade,
  periodIds: Array.isArray(row.period_ids) ? row.period_ids : [],
  points: row.points ?? 0,
  lifetimePoints: row.lifetime_points ?? 0,
  supportCount: row.support_count ?? 0,
  recentTag: row.recent_tag,
  status: row.status,
  iep: !!row.iep,
  plan504: !!row.plan_504,
  guardianName: row.guardian_name || "",
  guardianEmail: row.guardian_email || "",
  parentDigestEnabled: row.parent_digest_enabled !== false,
  createdAt: row.created_at,
  ownerId: row.owner_id || null,
});

export const studentToRow = (s, ownerId) => ({
  id: s.id,
  owner_id: ownerId,
  name: s.name,
  avatar: null,
  grade: s.grade || null,
  period_ids: s.periodIds || [],
  points: s.points ?? 0,
  lifetime_points: s.lifetimePoints ?? s.points ?? 0,
  support_count: s.supportCount ?? 0,
  recent_tag: s.recentTag || null,
  status: s.status || null,
  iep: !!s.iep,
  plan_504: !!s.plan504,
  guardian_name: s.guardianName || "",
  guardian_email: s.guardianEmail || "",
  parent_digest_enabled: s.parentDigestEnabled !== false,
  created_at: s.createdAt || new Date().toISOString(),
});

export const localCalendarDate = (date = new Date()) => date.toLocaleDateString("en-CA");

export const mapLog = (row) => ({
  id: row.id,
  studentId: row.student_id,
  type: row.type,
  tag: row.tag,
  note: row.note || "",
  notePrivate: !!row.note_private,
  notifyParent: !!row.notify_parent,
  includeInDigest: row.include_in_digest ?? !!row.notify_parent,
  timestamp: row.timestamp,
  logDate: row.log_date || null,
});

export const logToRow = (l, ownerId) => ({
  id: l.id,
  owner_id: ownerId,
  student_id: l.studentId,
  type: l.type,
  tag: l.tag || null,
  note: l.note || "",
  note_private: !!l.notePrivate,
  notify_parent: !!l.notifyParent,
  include_in_digest: l.includeInDigest ?? !!l.notifyParent,
  timestamp: l.timestamp || new Date().toISOString(),
  log_date: l.logDate || localCalendarDate(),
});

export const mapSkill = (row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  progress: row.progress ?? 0,
  baseline: row.baseline ?? 0,
  targetPercent: row.target_percent ?? 100,
  targetDate: row.target_date,
  status: row.status,
  lastPrompt: row.last_prompt,
  trials: row.trials || [null, null, null, null, null],
  trend: row.trend || [0, 0, 0, 0, 0, 0, 0],
  history: row.history || [],
  mastery: row.mastery,
});

export const skillToRow = (sk, studentId, ownerId) => ({
  id: sk.id,
  owner_id: ownerId,
  student_id: studentId,
  slug: sk.slug || null,
  name: sk.name || sk.title || "",
  progress: sk.progress ?? 0,
  baseline: sk.baseline ?? 0,
  target_percent: sk.targetPercent ?? 100,
  target_date: sk.targetDate || null,
  status: sk.status || null,
  last_prompt: sk.lastPrompt || null,
  trials: sk.trials || [null, null, null, null, null],
  trend: sk.trend || [0, 0, 0, 0, 0, 0, 0],
  history: sk.history || [],
  mastery: sk.mastery || null,
});

export const mapIep = (row) => ({
  id: row.id,
  description: row.description,
  domain: row.domain,
  baseline: row.baseline,
  targetPercent: row.target_percent,
  targetDate: row.target_date,
  reviewDate: row.review_date,
  accommodations: row.accommodations || [],
  linkedSkillSlugs: row.linked_skill_slugs || [],
  planType: row.plan_type,
  trials: row.trials || [null, null, null, null, null],
  history: row.history || [],
  mastery: row.mastery,
});

export const iepToRow = (g, studentId, ownerId) => ({
  id: g.id,
  owner_id: ownerId,
  student_id: studentId,
  description: g.description || "",
  domain: g.domain || null,
  baseline: g.baseline ?? null,
  target_percent: g.targetPercent ?? null,
  target_date: g.targetDate || null,
  review_date: g.reviewDate || null,
  accommodations: g.accommodations || [],
  linked_skill_slugs: g.linkedSkillSlugs || [],
  plan_type: g.planType || null,
  trials: g.trials || [null, null, null, null, null],
  history: g.history || [],
  mastery: g.mastery || null,
});

export const mapSend = (row) => ({
  id: row.id,
  studentId: row.student_id,
  entryIds: row.entry_ids || [],
  mode: row.mode,
  html: row.html || "",
  edited: !!row.edited,
  sentAt: row.sent_at,
});

const groupByStudent = (rows, mapFn) => {
  const map = {};
  (rows || []).forEach((row) => {
    const sid = row.student_id;
    if (!map[sid]) map[sid] = [];
    map[sid].push(mapFn(row));
  });
  return map;
};

export async function fetchProfile(userId, email) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  throwIf(error);

  let row = data;
  if (!row) {
    const { error: insertError } = await supabase.from("profiles").insert({ id: userId, email });
    if (insertError && insertError.code !== "23505") throwIf(insertError);
    const again = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    throwIf(again.error);
    row = again.data;
    if (!row) throw new Error("Couldn't load your profile. Sign in again.");
  }

  const { count, error: countError } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  throwIf(countError);

  const hasStudents = (count || 0) > 0;
  const hasClassroom = hasStudents || !!(row.name || "").trim() || !!(row.school_name || "").trim();
  if (!row.profile_complete && hasClassroom) {
    const { error: repairError } = await supabase
      .from("profiles")
      .update({ profile_complete: true })
      .eq("id", userId);
    throwIf(repairError);
    row = { ...row, profile_complete: true };
  }

  return mapProfile(row, email);
}

export async function upsertProfile(user) {
  const { error } = await supabase.from("profiles").upsert(profileToRow(user));
  throwIf(error);
}

const uniqueIds = (rows, key) => [...new Set((rows || []).map((row) => row[key]).filter(Boolean))];

export async function loadClassroom(ownerId) {
  const [students, logs, skills, iep, settings, sends, assignments] = await Promise.all([
    supabase.from("students").select("*").eq("owner_id", ownerId),
    supabase.from("behavior_logs").select("*").eq("owner_id", ownerId).order("timestamp", { ascending: false }),
    supabase.from("skill_goals").select("*").eq("owner_id", ownerId),
    supabase.from("iep_goals").select("*").eq("owner_id", ownerId),
    supabase.from("teacher_settings").select("*").eq("owner_id", ownerId).maybeSingle(),
    supabase.from("digest_sends").select("*").eq("owner_id", ownerId).order("sent_at", { ascending: true }),
    supabase.from("caseload_assignments").select("student_id").eq("case_manager_id", ownerId),
  ]);
  throwIf(students.error);
  throwIf(logs.error);
  throwIf(skills.error);
  throwIf(iep.error);
  throwIf(settings.error);
  throwIf(sends.error);
  throwIf(assignments.error);

  const ownedIds = new Set((students.data || []).map((row) => row.id));
  const assignedIds = uniqueIds(assignments.data, "student_id").filter((id) => !ownedIds.has(id));
  const placementRes = await supabase
    .from("pullout_placements")
    .select("student_id, period_id")
    .eq("case_manager_id", ownerId);
  const placements = placementRes.error ? [] : placementRes.data || [];
  let assignedStudents = [];
  let assignedLogs = [];
  let assignedSkills = [];
  let assignedIep = [];
  let teacherNames = new Map();
  if (assignedIds.length > 0) {
    const [assignedStudentsRes, assignedLogsRes, assignedSkillsRes, assignedIepRes, directoryRes] = await Promise.all([
      supabase.from("students").select("*").in("id", assignedIds),
      supabase.from("behavior_logs").select("*").in("student_id", assignedIds).eq("note_private", false).order("timestamp", { ascending: false }),
      supabase.from("skill_goals").select("*").in("student_id", assignedIds),
      supabase.from("iep_goals").select("*").in("student_id", assignedIds),
      supabase.rpc("school_directory"),
    ]);
    throwIf(assignedStudentsRes.error);
    throwIf(assignedLogsRes.error);
    throwIf(assignedSkillsRes.error);
    throwIf(assignedIepRes.error);
    assignedStudents = assignedStudentsRes.data || [];
    assignedLogs = (assignedLogsRes.data || []).filter((row) => !row.note_private);
    assignedSkills = assignedSkillsRes.data || [];
    assignedIep = assignedIepRes.data || [];
    if (!directoryRes.error) {
      teacherNames = new Map(
        (directoryRes.data || []).map((person) => [person.user_id, person.name || person.email || "Classroom teacher"])
      );
    }
  }

  const pulloutByStudent = new Map();
  placements.forEach((row) => {
    const current = pulloutByStudent.get(row.student_id) || [];
    current.push(row.period_id);
    pulloutByStudent.set(row.student_id, current);
  });

  const seenLogs = new Set();
  const mergedLogs = [...(logs.data || []), ...assignedLogs].filter((row) => {
    if (!row?.id || seenLogs.has(row.id)) return false;
    seenLogs.add(row.id);
    return true;
  });

  return {
    students: [
      ...(students.data || []).map((row) => ({ ...mapStudent(row), assigned: false, pulloutPeriodIds: [] })),
      ...assignedStudents.map((row) => ({
        ...mapStudent(row),
        assigned: true,
        teacherName: teacherNames.get(row.owner_id) || "Classroom teacher",
        pulloutPeriodIds: pulloutByStudent.get(row.id) || [],
      })),
    ],
    logs: mergedLogs.map(mapLog),
    skillsByStudent: groupByStudent([...(skills.data || []), ...assignedSkills], mapSkill),
    iepGoalsByStudent: groupByStudent([...(iep.data || []), ...assignedIep], mapIep),
    settings: settings.data || null,
    digestSends: (sends.data || []).map(mapSend),
  };
}

export async function upsertStudent(student, ownerId) {
  const { error } = await supabase.from("students").upsert(studentToRow(student, ownerId));
  throwIf(error);
}

export async function patchStudents(ownerId, ids, patch) {
  const { error } = await supabase.from("students").update(patch).eq("owner_id", ownerId).in("id", ids);
  throwIf(error);
}

export async function deleteStudentRow(id) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  throwIf(error);
}

export async function setPulloutPlacement({ caseManagerId, studentId, periodId, include }) {
  if (include) {
    const { error } = await supabase.from("pullout_placements").upsert(
      { case_manager_id: caseManagerId, student_id: studentId, period_id: periodId },
      { onConflict: "case_manager_id,student_id,period_id" }
    );
    throwIf(error);
    return;
  }
  const { error } = await supabase
    .from("pullout_placements")
    .delete()
    .eq("case_manager_id", caseManagerId)
    .eq("student_id", studentId)
    .eq("period_id", periodId);
  throwIf(error);
}

export async function insertLog(log, ownerId) {
  const { error } = await supabase.from("behavior_logs").insert(logToRow(log, ownerId));
  throwIf(error);
}

export async function patchLog(id, updates) {
  const patch = {};
  if ("includeInDigest" in updates) patch.include_in_digest = updates.includeInDigest;
  if ("notifyParent" in updates) patch.notify_parent = updates.notifyParent;
  if ("note" in updates) patch.note = updates.note;
  if ("notePrivate" in updates) patch.note_private = updates.notePrivate;
  if ("tag" in updates) patch.tag = updates.tag;
  const { error } = await supabase.from("behavior_logs").update(patch).eq("id", id);
  throwIf(error);
}

export async function upsertSkill(skill, studentId, ownerId) {
  const { error } = await supabase.from("skill_goals").upsert(skillToRow(skill, studentId, ownerId));
  throwIf(error);
}

export async function upsertIepGoal(goal, studentId, ownerId) {
  const { error } = await supabase.from("iep_goals").upsert(iepToRow(goal, studentId, ownerId));
  throwIf(error);
}

export async function upsertSettings(ownerId, settings) {
  const { error } = await supabase.from("teacher_settings").upsert({
    owner_id: ownerId,
    digest: settings.digest || {},
    points: settings.points || {},
    privacy: settings.privacy || {},
    checklist: settings.checklist || {},
    custom_skills: settings.customSkills || [],
    digest_drafts: settings.digestDrafts || {},
    class_section: settings.classSection || null,
    updated_at: new Date().toISOString(),
  });
  throwIf(error);
}

const readFunctionError = async (error) => {
  const fallback = error?.message || "Digest send failed";
  const ctx = error?.context;
  if (!ctx) return fallback;
  try {
    if (typeof ctx.json === "function") {
      const body = await ctx.clone().json();
      if (body?.error) return typeof body.error === "string" ? body.error : JSON.stringify(body.error);
      if (body?.message) return body.message;
    }
  } catch {
    /* body wasn't JSON */
  }
  try {
    if (typeof ctx.text === "function") {
      const text = (await ctx.clone().text()).trim();
      if (text) return text.slice(0, 500);
    }
  } catch {
    /* ignore */
  }
  return fallback;
};

export async function invokeSendDigest(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const { data, error } = await supabase.functions.invoke("send-digest", {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (error) throw new Error(await readFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data?.send;
}
