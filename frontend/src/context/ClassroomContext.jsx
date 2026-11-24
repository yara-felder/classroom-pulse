import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_DIGEST_SETTINGS, lastScheduledAt } from "@/lib/digestSchedule";
import { DEFAULT_POINT_SETTINGS, cycleBounds } from "@/lib/pointCycle";
import { buildDigestSnapshot } from "@/lib/digest";
import { buildOriginalDraft, mergeDraft, compileDigestHtml, isDraftEdited, DEFAULT_FOOTER } from "@/lib/digestDraft";
import { FERPA_NOTICE } from "@/lib/ferpa";
import { INITIAL_STUDENTS, CLASS_SECTIONS, INITIAL_SKILLS } from "@/data/mockData";
import { computeMasteryStreak, DEFAULT_MASTERY } from "@/components/goals/mastery";
import { useAuth } from "@/context/AuthContext";
import { can as canDo, DEFAULT_PRIVACY_SETTINGS } from "@/lib/rbac";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  loadClassroom,
  upsertStudent,
  patchStudents,
  deleteStudentRow,
  setPulloutPlacement,
  insertLog,
  localCalendarDate,
  patchLog,
  upsertSkill,
  upsertIepGoal,
  upsertSettings,
  invokeSendDigest,
  mapSend,
} from "@/lib/db";

const LOGS_KEY = "cp_logs";
const POINT_SETTINGS_KEY = "cp_point_settings";
const DIGEST_SETTINGS_KEY = "cp_digest_settings";
const DIGEST_SENDS_KEY = "cp_digest_sends";
const DIGEST_DRAFTS_KEY = "cp_digest_drafts";
const PRIVACY_KEY = "cp_privacy_settings";
const VIEW_AS_KEY = "cp_view_as";

const readLS = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const EMPTY_CHECKLIST = { done: {}, dismissed: false, collapsed: false };
const checklistKeyFor = (user) => (user ? `cp_checklist_${user.email || user.id || "me"}` : null);

const ClassroomContext = createContext(null);

const deriveStatus = (sk) => {
  if (computeMasteryStreak(sk.history, sk.mastery || DEFAULT_MASTERY).met) return "Mastered";
  if (sk.lastPrompt === "Refused" || sk.lastPrompt === "N/A") return "Needs Support";
  return "In Progress";
};

const DELTA = { independent: 5, prompted: 2, refused: -3 };
const LABEL = { independent: "Independent", prompted: "Prompted", refused: "N/A" };

const buildInitialSkillsByStudent = (students) => {
  const map = {};
  const today = new Date();
  const isoIn = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const daysOut = [30, 45, 60];
  students.forEach((s, sIdx) => {
    map[s.id] = INITIAL_SKILLS.map((sk, idx) => {
      const seeded = Math.min(100, Math.max(0, sk.progress + (idx * 3 - s.supportCount * 2)));
      const seedKey = (sIdx + 1) * 37 + (idx + 1) * 13;
      const seededAttempted = (sk.trials || []).filter((t) => t !== null);
      const seededToday = seededAttempted.length
        ? Math.round((seededAttempted.filter((t) => t === "independent").length / seededAttempted.length) * 100)
        : null;
      const history = upsertTodayHistory(build30DayHistory(sk.baseline ?? 0, seeded, seedKey), seededToday);
      const base = {
        ...sk,
        id: `${s.id}-${sk.slug}`,
        progress: seeded,
        trials: [...sk.trials],
        trend: [...sk.trend],
        history,
        targetDate: isoIn(daysOut[idx] ?? 45),
      };
      base.trend[base.trend.length - 1] = seeded;
      return { ...base, status: deriveStatus(base) };
    });
  });
  return map;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const seededRand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const build30DayHistory = (baseline, currentLevel, seedKey) => {
  const history = [];
  const today = new Date();
  const days = 30;
  for (let i = days - 1; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const t = (days - 1 - i) / (days - 1);
    const trend = baseline + (currentLevel - baseline) * t;
    const noise = (seededRand(seedKey + i) - 0.5) * 10;
    const pct = Math.max(0, Math.min(100, Math.round(trend + noise)));
    history.push({ date: d.toISOString().slice(0, 10), percent: pct });
  }
  return history;
};

const upsertTodayHistory = (history, todayScore) => {
  const today = todayIso();
  const base = (history || []).filter((h) => h.date !== today);
  if (todayScore == null) return base;
  return [...base, { date: today, percent: todayScore }].sort((a, b) => a.date.localeCompare(b.date));
};

const buildInitialIepGoals = (students) => {
  const map = {};
  const today = new Date();
  const isoIn = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const seeds = {
    "std-3": [
      {
        description:
          "Requests a break using a visual card in 4 out of 5 opportunities within a 30-minute activity.",
        domain: "Behavior / SEL",
        baseline: 30,
        targetPercent: 80,
        targetDate: isoIn(60),
        reviewDate: isoIn(30),
        accommodations: ["Visual Timer", "Movement Breaks", "Preferential Seating"],
        linkedSkillSlugs: ["request-a-break"],
        planType: "IEP",
      },
    ],
    "std-6": [
      {
        description:
          "Initiates a task independently within 2 minutes in 4 out of 5 trials across academic periods.",
        domain: "Executive Functioning",
        baseline: 20,
        targetPercent: 80,
        targetDate: isoIn(75),
        reviewDate: isoIn(30),
        accommodations: ["Visual Schedule", "Chunked Directions", "Fidget Tool"],
        linkedSkillSlugs: ["task-initiation"],
        planType: "IEP",
      },
    ],
  };
  students.forEach((s, sIdx) => {
    if (!seeds[s.id]) return;
    map[s.id] = seeds[s.id].map((g, i) => {
      const baseline = g.baseline ?? 20;
      const currentLevel = Math.round(baseline + ((g.targetPercent ?? 80) - baseline) * 0.6);
      const seedKey = (sIdx + 7) * 41 + (i + 1) * 19;
      const history = build30DayHistory(baseline, currentLevel, seedKey);
      return {
        id: `iep-${s.id}-${i}`,
        ...g,
        trials: [null, null, null, null, null],
        history,
      };
    });
  });
  return map;
};

const seedDemoStudents = () => {
  const ps = { ...DEFAULT_POINT_SETTINGS, ...readLS(POINT_SETTINGS_KEY, {}) };
  const resetThisCycle = ps.lastResetAt && new Date(ps.lastResetAt) >= cycleBounds(ps).start;
  return INITIAL_STUDENTS.map((s) => ({
    ...s,
    lifetimePoints: s.lifetimePoints ?? s.points,
    points: resetThisCycle ? 0 : s.points,
  }));
};

const localId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const ClassroomProvider = ({ children }) => {
  const { user: authUser, ready: authReady } = useAuth();
  const persistLive = Boolean(isSupabaseConfigured && authUser && !authUser.isDemo);
  const persistLiveRef = useRef(persistLive);
  persistLiveRef.current = persistLive;
  const ownerId = persistLive ? authUser.id : null;
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const pendingStudentIds = useRef(new Set());
  const localSettingsStamp = useRef(0);

  const [pointSettings, setPointSettings] = useState(() => ({
    ...DEFAULT_POINT_SETTINGS,
    ...readLS(POINT_SETTINGS_KEY, {}),
  }));
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [detailedMode, setDetailedMode] = useState(false);
  const [classSection, setClassSection] = useState(CLASS_SECTIONS[0].id);
  const [skillsByStudent, setSkillsByStudent] = useState({});
  const studentsRef = useRef(students);
  const skillsRef = useRef(skillsByStudent);
  studentsRef.current = students;
  skillsRef.current = skillsByStudent;
  const [iepGoalsByStudent, setIepGoalsByStudent] = useState({});
  const [customSkills, setCustomSkills] = useState([]);
  const [guide, setGuide] = useState(null);
  const [privacySettings, setPrivacySettings] = useState(() => ({
    ...DEFAULT_PRIVACY_SETTINGS,
    ...readLS(PRIVACY_KEY, {}),
  }));
  const [viewAsRole, setViewAsRoleState] = useState(() => readLS(VIEW_AS_KEY, null));
  const role = (authUser?.isDemo && viewAsRole) || authUser?.accessRole || "teacher";
  const can = (action) => canDo(role, action);
  const checklistKey = checklistKeyFor(authUser);
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [digestSettings, setDigestSettings] = useState(() => ({
    ...DEFAULT_DIGEST_SETTINGS,
    ...readLS(DIGEST_SETTINGS_KEY, {}),
  }));
  const [digestSends, setDigestSends] = useState(() => readLS(DIGEST_SENDS_KEY, []));
  const [digestDrafts, setDigestDrafts] = useState(() => readLS(DIGEST_DRAFTS_KEY, {}));

  const catchPersist = (err) => {
    console.error(err);
    toast.error("Couldn't save", { description: err?.message || "Check your connection and try again." });
  };

  const nextId = (prefix) =>
    persistLiveRef.current && typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : localId(prefix);

  const applyLocalClassroom = () => {
    setPointSettings({ ...DEFAULT_POINT_SETTINGS, ...readLS(POINT_SETTINGS_KEY, {}) });
    setStudents(seedDemoStudents());
    setLogs(readLS(LOGS_KEY, []).map((l) => ({ ...l, includeInDigest: l.includeInDigest ?? !!l.notifyParent })));
    setClassSection(CLASS_SECTIONS[0].id);
    setSkillsByStudent(buildInitialSkillsByStudent(INITIAL_STUDENTS));
    setIepGoalsByStudent(buildInitialIepGoals(INITIAL_STUDENTS));
    setCustomSkills([]);
    setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...readLS(PRIVACY_KEY, {}) });
    setChecklist(checklistKey ? { ...EMPTY_CHECKLIST, ...readLS(checklistKey, EMPTY_CHECKLIST) } : EMPTY_CHECKLIST);
    setDigestSettings({ ...DEFAULT_DIGEST_SETTINGS, ...readLS(DIGEST_SETTINGS_KEY, {}) });
    setDigestSends(readLS(DIGEST_SENDS_KEY, []));
    setDigestDrafts(readLS(DIGEST_DRAFTS_KEY, {}));
    hydratedRef.current = true;
    setHydrated(true);
  };

  useEffect(() => {
    if (!authReady) return;
    if (!authUser || authUser.isDemo || !isSupabaseConfigured) {
      applyLocalClassroom();
      return;
    }
    let cancelled = false;
    hydratedRef.current = false;
    setHydrated(false);
    const stampAtStart = localSettingsStamp.current;
    (async () => {
      try {
        const data = await loadClassroom(authUser.id);
        if (cancelled) return;
        const serverIds = new Set(data.students.map((student) => student.id));
        pendingStudentIds.current.forEach((id) => {
          if (serverIds.has(id)) pendingStudentIds.current.delete(id);
        });
        const justAdded = studentsRef.current.filter(
          (student) => pendingStudentIds.current.has(student.id) && !serverIds.has(student.id)
        );
        const mergedStudents = [...justAdded, ...data.students];
        studentsRef.current = mergedStudents;
        setStudents(mergedStudents);
        setLogs(data.logs);
        const mergedSkills = { ...data.skillsByStudent };
        justAdded.forEach((student) => {
          if (skillsRef.current[student.id]) mergedSkills[student.id] = skillsRef.current[student.id];
        });
        skillsRef.current = mergedSkills;
        setSkillsByStudent(mergedSkills);
        setIepGoalsByStudent(data.iepGoalsByStudent);
        setDigestSends(data.digestSends);
        const s = data.settings;
        if (s) {
          if (localSettingsStamp.current === stampAtStart) {
            setDigestSettings({ ...DEFAULT_DIGEST_SETTINGS, ...(s.digest || {}) });
            setPointSettings({ ...DEFAULT_POINT_SETTINGS, ...(s.points || {}) });
          }
          setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...(s.privacy || {}) });
          setChecklist({ ...EMPTY_CHECKLIST, ...(s.checklist || {}) });
          setCustomSkills(s.custom_skills || []);
          setDigestDrafts(s.digest_drafts || {});
        }
        const studentPeriodIds = data.students.flatMap((student) =>
          Array.isArray(student.periodIds) && student.periodIds.length
            ? student.periodIds
            : student.periodId
              ? [student.periodId]
              : []
        );
        const pendingPeriods = justAdded.flatMap((student) =>
          Array.isArray(student.periodIds) ? student.periodIds : []
        );
        const preferred = s?.class_section || authUser.periods?.[0]?.id || null;
        const nextSection =
          pendingPeriods.length && !pendingPeriods.includes(preferred)
            ? pendingPeriods[0]
            : preferred && studentPeriodIds.includes(preferred)
              ? preferred
              : pendingPeriods[0] || studentPeriodIds[0] || preferred;
        if (nextSection) setClassSection(nextSection);
        hydratedRef.current = true;
        setHydrated(true);
      } catch (err) {
        catchPersist(err);
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser?.id, authUser?.isDemo]);

  useEffect(() => {
    if (persistLive) return;
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs, persistLive]);

  useEffect(() => {
    if (persistLive) return;
    localStorage.setItem(DIGEST_DRAFTS_KEY, JSON.stringify(digestDrafts));
  }, [digestDrafts, persistLive]);

  useEffect(() => {
    if (persistLive) return;
    localStorage.setItem(DIGEST_SETTINGS_KEY, JSON.stringify(digestSettings));
  }, [digestSettings, persistLive]);

  useEffect(() => {
    if (persistLive) return;
    localStorage.setItem(DIGEST_SENDS_KEY, JSON.stringify(digestSends));
  }, [digestSends, persistLive]);

  useEffect(() => {
    if (persistLive) return;
    localStorage.setItem(POINT_SETTINGS_KEY, JSON.stringify(pointSettings));
  }, [pointSettings, persistLive]);

  useEffect(() => {
    if (!persistLive || !hydrated || !ownerId) return;
    const t = setTimeout(() => {
      upsertSettings(ownerId, {
        digest: digestSettings,
        points: pointSettings,
        privacy: privacySettings,
        checklist,
        customSkills,
        digestDrafts,
        classSection,
      }).catch(catchPersist);
    }, 400);
    return () => clearTimeout(t);
  }, [
    persistLive,
    hydrated,
    ownerId,
    digestSettings,
    pointSettings,
    privacySettings,
    checklist,
    customSkills,
    digestDrafts,
    classSection,
  ]);

  const updatePrivacySettings = (u) =>
    setPrivacySettings((prev) => {
      const next = { ...prev, ...u };
      if (!persistLive) localStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
      return next;
    });
  const setViewAsRole = (r) => {
    localStorage.setItem(VIEW_AS_KEY, JSON.stringify(r));
    setViewAsRoleState(r);
  };

  useEffect(() => {
    if (persistLive) return;
    setChecklist(checklistKey ? { ...EMPTY_CHECKLIST, ...readLS(checklistKey, EMPTY_CHECKLIST) } : EMPTY_CHECKLIST);
  }, [checklistKey, persistLive]);

  const updateChecklist = (updates) =>
    setChecklist((prev) => {
      const next = { ...prev, ...updates };
      if (!persistLive && checklistKey) localStorage.setItem(checklistKey, JSON.stringify(next));
      return next;
    });

  const markChecklist = (id) =>
    setChecklist((prev) => {
      if (prev.done[id]) return prev;
      const next = { ...prev, done: { ...prev.done, [id]: true } };
      if (!persistLive && checklistKey) localStorage.setItem(checklistKey, JSON.stringify(next));
      return next;
    });

  const saveDigestDraft = (studentId, overrides, weekStart) =>
    setDigestDrafts((prev) => ({ ...prev, [studentId]: { overrides, weekStart, savedAt: new Date().toISOString() } }));

  const clearDigestDraft = (studentId) =>
    setDigestDrafts((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });

  const updateDigestSettings = (updates) => {
    localSettingsStamp.current += 1;
    setDigestSettings((prev) => ({ ...prev, ...updates }));
  };
  const updatePointSettings = (updates) => {
    localSettingsStamp.current += 1;
    setPointSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetPoints = (at = new Date()) => {
    setStudents((prev) => {
      if (persistLive && prev.length) {
        patchStudents(
          ownerId,
          prev.map((s) => s.id),
          { points: 0 }
        ).catch(catchPersist);
      }
      return prev.map((s) => ({ ...s, points: 0 }));
    });
    setPointSettings((prev) => ({ ...prev, lastResetAt: at.toISOString() }));
  };

  useEffect(() => {
    const check = () => {
      setPointSettings((prev) => {
        if (prev.cadence === "manual") return prev;
        const start = cycleBounds(prev).start.toISOString();
        if (!prev.cycleStartSeen) return { ...prev, cycleStartSeen: start };
        if (new Date(prev.cycleStartSeen) >= new Date(start)) return prev;
        setStudents((list) => {
          if (persistLiveRef.current && list.length && authUser?.id) {
            patchStudents(
              authUser.id,
              list.map((s) => s.id),
              { points: 0 }
            ).catch(catchPersist);
          }
          return list.map((s) => ({ ...s, points: 0 }));
        });
        return { ...prev, cycleStartSeen: start, lastResetAt: start };
      });
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [pointSettings.cadence, authUser?.id]);

  const sendDigest = async (studentId, entryIds, mode = "manual", content = {}) => {
    const personalNote = content.personalNote || "";
    const intro = content.intro || "";
    const homeConnection = content.homeConnection || "";
    const footer = content.footer || "";
    const edited = !!content.edited;
    const entry = {
      id: nextId("dg"),
      studentId,
      entryIds,
      mode,
      html: content.previewHtml || "",
      edited,
      sentAt: new Date().toISOString(),
    };
    if (persistLive) {
      const saved = await invokeSendDigest({
        studentId,
        entryIds,
        mode,
        edited,
        id: entry.id,
        personalNote,
        intro,
        homeConnection,
        footer,
      });
      const mapped = saved ? mapSend(saved) : entry;
      setDigestSends((prev) => [...prev, mapped]);
      clearDigestDraft(studentId);
      return mapped;
    }
    setDigestSends((prev) => [...prev, entry]);
    clearDigestDraft(studentId);
    return entry;
  };

  useEffect(() => {
    if (!hydrated) return;
    if (digestSettings.approvalMode !== "auto") return;
    const last = lastScheduledAt(digestSettings);
    if (digestSettings.lastAutoRunAt && new Date(digestSettings.lastAutoRunAt) >= last) return;
    const sentIds = new Set(digestSends.flatMap((s) => s.entryIds));
    const sentAt = last.toISOString();
    const auto = students
      .filter((s) => s.parentDigestEnabled !== false && s.guardianEmail)
      .map((s) => {
        const snap = buildDigestSnapshot({
          student: s,
          logs,
          skills: skillsByStudent[s.id],
          iepGoals: iepGoalsByStudent[s.id],
          sentIds,
          now: last,
        });
        if (!snap.queued.length) return null;
        const original = buildOriginalDraft(s, snap, digestSettings);
        const draft = mergeDraft(original, digestDrafts[s.id]);
        const html = compileDigestHtml({
          student: s,
          draft,
          footer: digestSettings.footer || DEFAULT_FOOTER,
          ferpa: FERPA_NOTICE,
        });
        return {
          id: persistLive ? crypto.randomUUID() : `dg-auto-${s.id}-${last.getTime()}`,
          studentId: s.id,
          entryIds: snap.queued.map((l) => l.id),
          mode: "auto",
          html,
          personalNote: draft.personalNote,
          intro: draft.intro,
          homeConnection: draft.homeConnection,
          footer: digestSettings.footer || DEFAULT_FOOTER,
          edited: isDraftEdited(draft, original),
          sentAt,
        };
      })
      .filter(Boolean);

    const run = async () => {
      if (persistLive && auto.length) {
        const saved = [];
        for (const a of auto) {
          try {
            const row = await invokeSendDigest({
              studentId: a.studentId,
              entryIds: a.entryIds,
              mode: "auto",
              edited: a.edited,
              id: a.id,
              personalNote: a.personalNote,
              intro: a.intro,
              homeConnection: a.homeConnection,
              footer: a.footer,
            });
            saved.push(row ? mapSend(row) : a);
            clearDigestDraft(a.studentId);
          } catch (err) {
            catchPersist(err);
          }
        }
        if (saved.length) {
          setDigestSends((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...saved.filter((a) => !seen.has(a.id))];
          });
        }
      } else if (auto.length) {
        setDigestSends((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...auto.filter((a) => !seen.has(a.id))];
        });
        auto.forEach((a) => clearDigestDraft(a.studentId));
      }
      setDigestSettings((prev) => ({ ...prev, lastAutoRunAt: new Date().toISOString() }));
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per schedule change, not on every log/send update
  }, [hydrated, digestSettings.approvalMode, digestSettings.day, digestSettings.time, persistLive, authUser?.id]);

  const updateStudent = (id, updates) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...updates };
        if (updates.periodId && !updates.periodIds) {
          next.periodIds = [updates.periodId];
          delete next.periodId;
        }
        if (Array.isArray(updates.periodIds)) {
          next.periodIds = [...new Set(updates.periodIds)];
        }
        if (updates.firstName != null || updates.lastName != null) {
          const parts = (next.name || "").split(" ");
          const fn = updates.firstName ?? parts[0] ?? "";
          const ln = updates.lastName ?? parts.slice(1).join(" ") ?? "";
          const fullName = `${fn} ${ln}`.trim();
          next.name = fullName;
        }
        if (persistLive) upsertStudent(next, ownerId).catch(catchPersist);
        return next;
      })
    );
  };

  const addIepGoal = (studentId, goal) => {
    const id = nextId("iep");
    const row = { id, trials: [null, null, null, null, null], history: [], ...goal };
    setIepGoalsByStudent((prev) => ({
      ...prev,
      [studentId]: [...(prev[studentId] || []), row],
    }));
    if (persistLive) upsertIepGoal(row, studentId, ownerId).catch(catchPersist);
  };

  const logIepTrial = (studentId, goalId, trialIdx, level) => {
    markChecklist("iep");
    setIepGoalsByStudent((prev) => {
      const list = prev[studentId] || [];
      const next = list.map((g) => {
        if (g.id !== goalId) return g;
        const trials = [...(g.trials || [null, null, null, null, null])];
        trials[trialIdx] = level;
        const attempted = trials.filter((t) => t !== null);
        const indCount = attempted.filter((t) => t === "independent").length;
        const todayScore = attempted.length > 0 ? Math.round((indCount / attempted.length) * 100) : null;
        const history = upsertTodayHistory(g.history, todayScore);
        const updated = { ...g, trials, history };
        if (persistLive) upsertIepGoal(updated, studentId, ownerId).catch(catchPersist);
        return updated;
      });
      return { ...prev, [studentId]: next };
    });
  };

  const setSkillMastery = (studentId, skillId, mastery) => {
    setSkillsByStudent((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || []).map((sk) => {
        if (sk.id !== skillId) return sk;
        const nextSk = { ...sk, mastery };
        const withStatus = { ...nextSk, status: deriveStatus(nextSk) };
        if (persistLive) upsertSkill(withStatus, studentId, ownerId).catch(catchPersist);
        return withStatus;
      }),
    }));
  };

  const setIepMastery = (studentId, goalId, mastery) => {
    setIepGoalsByStudent((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || []).map((g) => {
        if (g.id !== goalId) return g;
        const updated = { ...g, mastery };
        if (persistLive) upsertIepGoal(updated, studentId, ownerId).catch(catchPersist);
        return updated;
      }),
    }));
  };

  const addCustomSkill = (name, action = "") => {
    const skill = {
      id: nextId("custom"),
      title: name,
      action,
      label: action ? `${name} (${action})` : name,
      custom: true,
    };
    setCustomSkills((prev) => [...prev, skill]);
    return skill;
  };

  const addPositive = (studentId, skillLabel, { notifyParent = false, note = "", notePrivate = false } = {}) => {
    markChecklist("positive");
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const next = {
          ...s,
          points: s.points + 1,
          lifetimePoints: (s.lifetimePoints ?? 0) + 1,
          recentTag: skillLabel,
          status: "Connected",
        };
        if (persistLive) upsertStudent(next, ownerId).catch(catchPersist);
        return next;
      })
    );
    const log = {
      id: nextId("log"),
      studentId,
      type: "positive",
      tag: skillLabel,
      note,
      notePrivate: !!(note && notePrivate),
      notifyParent: !!notifyParent,
      includeInDigest: !!notifyParent,
      timestamp: new Date().toISOString(),
      logDate: localCalendarDate(),
    };
    setLogs((prev) => [log, ...prev]);
    if (persistLive) insertLog(log, ownerId).catch(catchPersist);
  };

  const addSupport = (studentId, tagLabel, note = "", { notifyParent = false, notePrivate = false } = {}) => {
    markChecklist("support");
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const next = { ...s, supportCount: s.supportCount + 1, recentTag: tagLabel, status: "Needs Guidance" };
        if (persistLive) upsertStudent(next, ownerId).catch(catchPersist);
        return next;
      })
    );
    const log = {
      id: nextId("log"),
      studentId,
      type: "support",
      tag: tagLabel,
      note,
      notePrivate: !!(note && notePrivate),
      notifyParent: !!notifyParent,
      includeInDigest: !!notifyParent,
      timestamp: new Date().toISOString(),
      logDate: localCalendarDate(),
    };
    setLogs((prev) => [log, ...prev]);
    if (persistLive) insertLog(log, ownerId).catch(catchPersist);
  };

  const addQuickLog = (studentId, note, tag, notifyParent, notePrivate = false) => {
    const log = {
      id: nextId("log"),
      studentId,
      type: "note",
      tag: tag || "Note",
      note,
      notePrivate: !!(note && notePrivate),
      notifyParent: !!notifyParent,
      includeInDigest: !!notifyParent,
      timestamp: new Date().toISOString(),
      logDate: localCalendarDate(),
    };
    setLogs((prev) => [log, ...prev]);
    if (persistLive) insertLog(log, ownerId).catch(catchPersist);
  };

  const updateLog = (logId, updates) => {
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...updates } : l)));
    if (persistLive) patchLog(logId, updates).catch(catchPersist);
  };

  const toggleLogDigest = (logId) => {
    setLogs((prev) => {
      const next = prev.map((l) => {
        if (l.id !== logId) return l;
        const updated = { ...l, includeInDigest: !l.includeInDigest, notifyParent: !l.includeInDigest };
        if (persistLive) patchLog(logId, updated).catch(catchPersist);
        return updated;
      });
      return next;
    });
  };

  const applyPromptToSkill = (sk, level) => {
    const delta = DELTA[level] ?? 0;
    const progress = Math.min(100, Math.max(0, sk.progress + delta));
    const nextSk = { ...sk, progress, lastPrompt: LABEL[level] };
    nextSk.status = deriveStatus(nextSk);
    const trend = [...(sk.trend || [])];
    if (trend.length > 0) trend[trend.length - 1] = progress;
    nextSk.trend = trend;
    return nextSk;
  };

  const logPrompt = (studentId, skillId, level) => {
    setSkillsByStudent((prev) => {
      const next = { ...prev };
      next[studentId] = (prev[studentId] || []).map((sk) => {
        if (sk.id !== skillId) return sk;
        const updated = applyPromptToSkill(sk, level);
        if (persistLive) upsertSkill(updated, studentId, ownerId).catch(catchPersist);
        return updated;
      });
      return next;
    });
  };

  const logTrial = (studentId, skillId, trialIdx, level) => {
    markChecklist("iep");
    setSkillsByStudent((prev) => {
      const next = { ...prev };
      next[studentId] = (prev[studentId] || []).map((sk) => {
        if (sk.id !== skillId) return sk;
        const trials = [...(sk.trials || [null, null, null, null, null])];
        trials[trialIdx] = level;
        const attempted = trials.filter((t) => t !== null);
        const indCount = attempted.filter((t) => t === "independent").length;
        const todayScore = attempted.length > 0 ? Math.round((indCount / attempted.length) * 100) : null;
        let progress = sk.progress;
        let lastPrompt = sk.lastPrompt;
        if (todayScore != null) progress = todayScore;
        if (level) lastPrompt = LABEL[level];
        const trend = [...(sk.trend || [])];
        if (trend.length > 0) trend[trend.length - 1] = progress;
        const history = upsertTodayHistory(sk.history, todayScore);
        const nextSk = { ...sk, trials, progress, lastPrompt, trend, history };
        nextSk.status = deriveStatus(nextSk);
        if (persistLive) upsertSkill(nextSk, studentId, ownerId).catch(catchPersist);
        return nextSk;
      });
      return next;
    });
  };

  const addStudent = ({
    firstName,
    lastName,
    grade,
    iep,
    plan504,
    initialSkills = [],
    periodIds,
    periodId,
    guardianName = "",
    guardianEmail = "",
    parentDigestEnabled = true,
  }) => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const id = nextId("std");
    pendingStudentIds.current.add(id);
    const resolvedPeriodIds =
      Array.isArray(periodIds) && periodIds.length > 0
        ? [...new Set(periodIds)]
        : periodId
          ? [periodId]
          : [classSection];
    const newStudent = {
      id,
      name: fullName,
      grade: (grade || "").trim(),
      periodIds: resolvedPeriodIds,
      points: 0,
      lifetimePoints: 0,
      supportCount: 0,
      recentTag: "Just joined",
      status: "Connected",
      iep: !!iep,
      plan504: !!plan504,
      ownerId: authUser?.id || null,
      assigned: false,
      guardianName: guardianName.trim(),
      guardianEmail: guardianEmail.trim(),
      parentDigestEnabled: !!parentDigestEnabled,
      createdAt: new Date().toISOString(),
    };
    const withStudent = [newStudent, ...studentsRef.current.filter((student) => student.id !== id)];
    studentsRef.current = withStudent;
    setStudents(withStudent);

    if (initialSkills.length > 0) {
      const today = new Date();
      const target = new Date(today);
      target.setDate(target.getDate() + 45);
      const skills = initialSkills.map((name) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return {
          id: persistLive ? crypto.randomUUID() : `${id}-${slug}`,
          slug,
          name,
          progress: 0,
          baseline: 0,
          targetPercent: 100,
          targetDate: target.toISOString().slice(0, 10),
          status: "In Progress",
          lastPrompt: null,
          trials: [null, null, null, null, null],
          trend: [0, 0, 0, 0, 0, 0, 0],
        };
      });
      const withSkills = { ...skillsRef.current, [id]: skills };
      skillsRef.current = withSkills;
      setSkillsByStudent(withSkills);
      if (persistLive) {
        upsertStudent(newStudent, ownerId)
          .then(() => Promise.all(skills.map((sk) => upsertSkill(sk, id, ownerId))))
          .catch(catchPersist);
      }
    } else if (persistLive) {
      upsertStudent(newStudent, ownerId).catch(catchPersist);
    }

    return newStudent;
  };

  const deleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSkillsByStudent((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setIepGoalsByStudent((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setLogs((prev) => prev.filter((l) => l.studentId !== id));
    if (persistLive) deleteStudentRow(id).catch(catchPersist);
  };

  const setSkillTarget = (studentId, skillId, { baseline, targetDate, targetPercent }) => {
    setSkillsByStudent((prev) => {
      const next = { ...prev };
      next[studentId] = (prev[studentId] || []).map((sk) => {
        if (sk.id !== skillId) return sk;
        const updated = {
          ...sk,
          baseline: baseline != null && baseline !== "" ? Number(baseline) : sk.baseline,
          targetDate: targetDate || sk.targetDate,
          targetPercent:
            targetPercent != null && targetPercent !== "" ? Number(targetPercent) : sk.targetPercent,
        };
        if (persistLive) upsertSkill(updated, studentId, ownerId).catch(catchPersist);
        return updated;
      });
      return next;
    });
  };

  const addSkill = (studentId, name) => {
    setSkillsByStudent((prev) => {
      const next = { ...prev };
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const today = new Date();
      const target = new Date(today);
      target.setDate(target.getDate() + 45);
      const skill = {
        id: nextId("skill"),
        slug,
        name,
        progress: 0,
        baseline: 0,
        targetPercent: 100,
        targetDate: target.toISOString().slice(0, 10),
        status: "In Progress",
        lastPrompt: null,
        trials: [null, null, null, null, null],
        trend: [0, 0, 0, 0, 0, 0, 0],
      };
      next[studentId] = [...(prev[studentId] || []), skill];
      if (persistLive) upsertSkill(skill, studentId, ownerId).catch(catchPersist);
      return next;
    });
  };

  const setPullout = (studentId, periodId, include) => {
    setStudents((prev) => {
      const next = prev.map((student) => {
        if (student.id !== studentId) return student;
        const current = student.pulloutPeriodIds || [];
        const pulloutPeriodIds = include
          ? [...new Set([...current, periodId])]
          : current.filter((id) => id !== periodId);
        return { ...student, pulloutPeriodIds };
      });
      studentsRef.current = next;
      return next;
    });
    if (persistLive && authUser?.id) {
      setPulloutPlacement({ caseManagerId: authUser.id, studentId, periodId, include }).catch(catchPersist);
    }
  };

  const value = {
    students,
    logs,
    detailedMode,
    setDetailedMode,
    classSection,
    setClassSection,
    addPositive,
    addSupport,
    addQuickLog,
    updateLog,
    toggleLogDigest,
    skillsByStudent,
    logPrompt,
    logTrial,
    setSkillTarget,
    setSkillMastery,
    setIepMastery,
    addSkill,
    addStudent,
    updateStudent,
    deleteStudent,
    setPullout,
    customSkills,
    addCustomSkill,
    iepGoalsByStudent,
    addIepGoal,
    logIepTrial,
    digestSettings,
    updateDigestSettings,
    digestSends,
    sendDigest,
    digestDrafts,
    saveDigestDraft,
    clearDigestDraft,
    pointSettings,
    updatePointSettings,
    resetPoints,
    checklist,
    markChecklist,
    updateChecklist,
    guide,
    setGuide,
    role,
    can,
    viewAsRole,
    setViewAsRole,
    privacySettings,
    updatePrivacySettings,
    persistLive,
  };

  if (authReady && persistLive && !hydrated) {
    return (
      <ClassroomContext.Provider value={value}>
        <div className="min-h-screen grain-bg flex items-center justify-center text-sm text-slate-500">
          Loading your classroom…
        </div>
      </ClassroomContext.Provider>
    );
  }

  return <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>;
};

export const useClassroom = () => {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error("useClassroom must be used within ClassroomProvider");
  return ctx;
};
