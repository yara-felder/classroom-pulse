import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const CADENCES = [
  { id: "weekly", label: "Weekly (Resets Monday morning)" },
  { id: "monthly", label: "Monthly (Resets 1st of the month)" },
  { id: "manual", label: "Manual Reset Only" },
];

export const STRETCH = [
  { id: "soft", label: "Soft Goal (-10%)", factor: 0.9 },
  { id: "standard", label: "Standard (100% of avg)", factor: 1 },
  { id: "challenge", label: "Challenge (+15%)", factor: 1.15 },
];

export const DEFAULT_POINT_SETTINGS = {
  cadence: "weekly",
  goalMode: "auto",
  baselineWeeks: 3,
  stretch: "standard",
  customTarget: 150,
  lastResetAt: null,
  cycleStartSeen: null,
};

export const cycleBounds = (settings, now = new Date()) => {
  if (settings.cadence === "monthly") {
    const start = startOfMonth(now);
    return { start, end: endOfMonth(now), resetAt: addMonths(start, 1) };
  }
  if (settings.cadence === "manual") {
    const start = settings.lastResetAt ? new Date(settings.lastResetAt) : startOfWeek(now, { weekStartsOn: 1 });
    return { start, end: null, resetAt: null };
  }
  const start = startOfWeek(now, { weekStartsOn: 1 });
  return { start, end: addDays(start, 4), resetAt: addDays(start, 7) };
};

export const cycleRangeLabel = (b) =>
  b.end ? `${format(b.start, "MMM d")} – ${format(b.end, "MMM d")}` : `Since ${format(b.start, "MMM d")}`;

export const resetsInLabel = (b, now = new Date()) => {
  if (!b.resetAt) return "Manual reset only";
  const d = differenceInCalendarDays(b.resetAt, now);
  if (d <= 0) return "Resets today";
  return d === 1 ? "Resets tomorrow" : `Resets in ${d} days`;
};

const hash = (str) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// Deterministic mock school-day activity for a student (history stand-in).
export const mockDaily = (studentId, date) => {
  const h = hash(`${studentId}|${format(date, "yyyy-MM-dd")}`);
  const propensity = hash(studentId) % 3;
  const r = h >> 4;
  const support = propensity === 0 ? (r % 5 === 0 ? 1 : 0) : propensity === 1 ? r % 2 : r % 3;
  return { positive: 1 + (h % 5), support };
};

export const SCHOOL_TIME_ZONE = "America/Los_Angeles";

const pad = (value) => String(value).padStart(2, "0");

export const schoolCalendarDate = (value) => {
  if (value == null || value === "") return "";
  if (!(value instanceof Date)) {
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    value = new Date(text);
  }
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHOOL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) return "";
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const schoolNow = (now = new Date()) => {
  const day = schoolCalendarDate(now);
  return day ? new Date(`${day}T12:00:00`) : now;
};

const sameDay = (iso, date) => schoolCalendarDate(iso) === format(date, "yyyy-MM-dd");

export const logCalendarDate = (log) => {
  const occurred = schoolCalendarDate(log?.timestamp);
  if (occurred) return occurred;
  const created = schoolCalendarDate(log?.createdAt || log?.created_at);
  if (created) return created;
  const stored = log?.logDate == null ? "" : String(log.logDate).trim();
  return /^\d{4}-\d{2}-\d{2}/.test(stored) ? stored.slice(0, 10) : "";
};

export const countLogsOnDay = (students, logs, date) => {
  if (isWeekend(date) || startOfDay(date) > startOfDay(schoolNow())) return { positive: 0, support: 0 };
  const key = format(date, "yyyy-MM-dd");
  const ids = new Set(students.map((student) => student.id));
  const dayLogs = logs.filter((log) => ids.has(log.studentId) && logCalendarDate(log) === key);
  return {
    positive: dayLogs.filter((log) => log.type === "positive").length,
    support: dayLogs.filter((log) => log.type === "support").length,
  };
};

export const weekdayBounds = (weekOffset = 0, now = schoolNow()) => {
  const monday = addDays(startOfWeek(startOfDay(now), { weekStartsOn: 1 }), weekOffset * 7);
  const friday = addDays(monday, 4);
  return {
    start: monday,
    end: friday,
    startIso: format(monday, "yyyy-MM-dd"),
    endIso: format(friday, "yyyy-MM-dd"),
  };
};

export const earliestLogIso = (logs) => {
  let earliest = "";
  (logs || []).forEach((log) => {
    const day = logCalendarDate(log);
    if (!day) return;
    if (!earliest || day < earliest) earliest = day;
  });
  return earliest || null;
};

export const minWeekOffsetForDate = (isoDate, now = schoolNow()) => {
  if (!isoDate) return 0;
  const parsed = new Date(`${String(isoDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const loggedMonday = startOfWeek(parsed, { weekStartsOn: 1 });
  const currentMonday = startOfWeek(startOfDay(now), { weekStartsOn: 1 });
  const weeks = Math.trunc(differenceInCalendarDays(loggedMonday, currentMonday) / 7);
  return Math.min(0, weeks);
};

export const schoolWeekRangeLabel = (start, end) => {
  const sameYear = format(start, "yyyy") === format(end, "yyyy");
  if (sameYear) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
};

export const schoolWeekOptions = (minWeekOffset = 0, now = schoolNow()) => {
  const floor = Math.min(0, minWeekOffset);
  const options = [];
  for (let offset = 0; offset >= floor; offset -= 1) {
    const { start, end } = weekdayBounds(offset, now);
    const range = schoolWeekRangeLabel(start, end);
    options.push({ offset, label: offset === 0 ? `${range} (This Week)` : range });
  }
  return options;
};

export const loggedWeekSeries = (students, logs, weekOffset = 0) => {
  const { start } = weekdayBounds(weekOffset);
  return [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(start, offset);
    return { date: format(date, "MM/dd"), weekday: format(date, "yyyy-MM-dd"), ...countLogsOnDay(students, logs, date) };
  });
};

export const loggedRange = (students, logs, start, end) => {
  const now = schoolNow();
  const last = end && startOfDay(end) < startOfDay(now) ? end : now;
  if (startOfDay(start) > startOfDay(last)) return { positive: 0, support: 0 };
  const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(last) });
  return days.reduce(
    (acc, date) => {
      const totals = countLogsOnDay(students, logs, date);
      acc.positive += totals.positive;
      acc.support += totals.support;
      return acc;
    },
    { positive: 0, support: 0 }
  );
};

export const studentDay = (studentId, date, logs, since) => {
  if (isWeekend(date) || startOfDay(date) > startOfDay(schoolNow())) return { positive: 0, support: 0 };
  const base = since && startOfDay(date) <= startOfDay(new Date(since)) ? { positive: 0, support: 0 } : mockDaily(studentId, date);
  const dayLogs = logs.filter((l) => l.studentId === studentId && sameDay(l.timestamp, date));
  return {
    positive: base.positive + dayLogs.filter((l) => l.type === "positive").length,
    support: base.support + dayLogs.filter((l) => l.type === "support").length,
  };
};

export const sumRange = (students, logs, start, end) => {
  const now = schoolNow();
  const last = end && startOfDay(end) < startOfDay(now) ? end : now;
  if (startOfDay(start) > startOfDay(last)) return { positive: 0, support: 0 };
  const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(last) });
  return students.reduce(
    (acc, s) => {
      days.forEach((d) => {
        const v = studentDay(s.id, d, logs, s.createdAt);
        acc.positive += v.positive;
        acc.support += v.support;
      });
      return acc;
    },
    { positive: 0, support: 0 }
  );
};

export const STARTER_PER_STUDENT_WEEKLY = 10;

export const baselineStats = (students, logs, weeks) => {
  const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  let total = 0;
  for (let w = 1; w <= weeks; w++) {
    const mon = addDays(thisMonday, -7 * w);
    total += sumRange(students, logs, mon, addDays(mon, 4)).positive;
  }
  const starter = students.length > 0 && total === 0;
  const perStudentWeekly = starter ? STARTER_PER_STUDENT_WEEKLY : students.length ? total / (weeks * students.length) : 0;
  return { perStudentWeekly, weeklyTotal: Math.round(perStudentWeekly * students.length), starter };
};

const cycleWeeks = (settings, now = new Date()) => {
  if (settings.cadence !== "monthly") return 1;
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).filter((d) => !isWeekend(d));
  return days.length / 5;
};

export const classGoal = (settings, students, logs) => {
  const bounds = cycleBounds(settings);
  const progress = sumRange(students, logs, bounds.start, bounds.end).positive;
  const base = baselineStats(students, logs, settings.baselineWeeks);
  const factor = (STRETCH.find((s) => s.id === settings.stretch) || STRETCH[1]).factor;
  const target =
    settings.goalMode === "custom"
      ? Math.max(1, Number(settings.customTarget) || 1)
      : Math.max(1, Math.round(base.perStudentWeekly * students.length * factor * cycleWeeks(settings)));
  return { bounds, progress, target, base, factor, pct: Math.min(100, Math.round((progress / target) * 100)) };
};

export const thisWeekSeries = (students, logs) => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return [0, 1, 2, 3, 4].map((i) => {
    const d = addDays(monday, i);
    const totals = students.reduce(
      (acc, s) => {
        const v = studentDay(s.id, d, logs, s.createdAt);
        return { positive: acc.positive + v.positive, support: acc.support + v.support };
      },
      { positive: 0, support: 0 }
    );
    return { date: format(d, "M/d"), ...totals };
  });
};
