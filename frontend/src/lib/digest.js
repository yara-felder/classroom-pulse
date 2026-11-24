import { deriveIepStatus } from "@/lib/goalSummaries";

export const isInDigest = (l) => l.includeInDigest === true;

// Current school week: Monday 00:00 through Friday 23:59 (weekends map to the week just ended).
export const weekBounds = (now = new Date()) => {
  const d = new Date(now);
  const offset = (d.getDay() + 6) % 7;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 4, 23, 59, 59, 999);
  return { start, end };
};

export const buildDigestSnapshot = ({ student, logs, skills, iepGoals, sentIds, now = new Date() }) => {
  const { start, end } = weekBounds(now);
  const inWeek = logs.filter((l) => {
    if (l.studentId !== student.id) return false;
    const t = new Date(l.timestamp);
    return t >= start && t <= end && t <= now;
  });
  const weekLogs = inWeek.filter((l) => !(sentIds && sentIds.has(l.id)));
  const queued = weekLogs.filter(isInDigest).map((l) => (l.notePrivate ? { ...l, note: "", context: {} } : { ...l, context: {} }));
  const hasPlan = !!(student.iep || student.plan504);
  const mastered = [
    ...(skills || []).filter((sk) => sk.status === "Mastered").map((sk) => ({ id: sk.id, name: sk.name, kind: "Skill" })),
    ...(hasPlan ? iepGoals || [] : [])
      .filter((g) => deriveIepStatus(g) === "Mastered")
      .map((g) => ({ id: g.id, name: g.description, kind: g.planType || "IEP" })),
  ];
  return {
    week: { start, end },
    inWeek,
    weekLogs,
    queued,
    flagged: queued,
    wins: queued.filter((l) => l.type === "positive"),
    supportNotes: queued.filter((l) => l.type !== "positive"),
    mastered,
  };
};
