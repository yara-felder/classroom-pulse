import { addDays, format, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { countLogsOnDay, logCalendarDate, weekdayBounds } from "@/lib/pointCycle";

const iso = (date) => format(date, "yyyy-MM-dd");

export const ratioOf = (positive, support) => {
  const total = positive + support;
  if (total === 0) return 100;
  return Math.round((positive / total) * 100);
};

export const sumDays = (days) =>
  days.reduce(
    (acc, day) => ({
      positive: acc.positive + day.positive,
      support: acc.support + day.support,
    }),
    { positive: 0, support: 0 }
  );

export const groupAnalyticsRows = (rows) => {
  const byTeacher = new Map();
  (rows || []).forEach((row) => {
    const teacherId = row.teacher_id;
    if (!byTeacher.has(teacherId)) {
      byTeacher.set(teacherId, {
        teacherId,
        name: row.teacher_name || "Teacher",
        title: row.teacher_title || "",
        days: [],
      });
    }
    const weekday = typeof row.weekday === "string" ? row.weekday.slice(0, 10) : iso(new Date(row.weekday));
    byTeacher.get(teacherId).days.push({
      weekday,
      label: format(new Date(`${weekday}T12:00:00`), "MM/dd"),
      positive: Number(row.positive_count) || 0,
      support: Number(row.support_count) || 0,
    });
  });
  return [...byTeacher.values()]
    .map((classroom) => ({
      ...classroom,
      days: [...classroom.days].sort((a, b) => a.weekday.localeCompare(b.weekday)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const currentWeekdays = (days) => {
  if (!days?.length || days.length <= 5) return days || [];
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const start = iso(monday);
  const end = iso(addDays(monday, 4));
  const week = days.filter((day) => day.weekday >= start && day.weekday <= end);
  return week.length ? week : days.slice(-5);
};

export const chartSeries = (classrooms) => {
  const byDay = new Map();
  classrooms.forEach((classroom) => {
    currentWeekdays(classroom.days).forEach((day) => {
      const prev = byDay.get(day.weekday) || { date: day.label, weekday: day.weekday, positive: 0, support: 0 };
      prev.positive += day.positive;
      prev.support += day.support;
      byDay.set(day.weekday, prev);
    });
  });
  return [...byDay.values()].sort((a, b) => a.weekday.localeCompare(b.weekday));
};

export const demoClassrooms = (user, students, logs, weekOffset = 0) => {
  const { start } = weekdayBounds(weekOffset);
  const days = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(start, offset);
    const totals = countLogsOnDay(students, logs, date);
    return {
      weekday: iso(date),
      label: format(date, "MM/dd"),
      positive: totals.positive,
      support: totals.support,
    };
  });
  return [
    {
      teacherId: user?.id || "demo-teacher",
      name: user?.name || "Teacher",
      title: user?.role || "Teacher",
      days,
    },
  ];
};

export const loadSchoolEarliestLogDate = async (userId) => {
  const membership = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (membership.error || !membership.data?.school_id) return null;

  const earliest = await supabase.rpc("get_school_earliest_log_date", {
    p_school_id: membership.data.school_id,
  });
  if (earliest.error || !earliest.data) return null;
  return String(earliest.data).slice(0, 10);
};

export const TODAY_BLOCKS = ["Morning", "Lunch/Recess", "Afternoon"];

export const todayHeading = (now = new Date()) => `Today · ${format(now, "EEE, MMM d, yyyy")}`;

export const todayDateLabel = (now = new Date()) => format(now, "EEE, MMM d, yyyy");

export const timeBlockLabel = (timestamp) => {
  const parsed = timestamp ? new Date(timestamp) : null;
  const hour = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getHours() : 9;
  if (hour < 11) return "Morning";
  if (hour < 13) return "Lunch/Recess";
  return "Afternoon";
};

const emptyBlocks = () => TODAY_BLOCKS.map((label) => ({ label, positive: 0, support: 0 }));

export const summarizeToday = (logs) => {
  const blocks = emptyBlocks();
  const tags = new Map();
  let positive = 0;
  let support = 0;
  (logs || []).forEach((log) => {
    if (log.type !== "positive" && log.type !== "support") return;
    if (log.type === "positive") positive += 1;
    else support += 1;
    const block = blocks.find((item) => item.label === timeBlockLabel(log.timestamp));
    if (block) block[log.type === "positive" ? "positive" : "support"] += 1;
    const tag = (log.tag || "").trim();
    if (tag) tags.set(tag, (tags.get(tag) || 0) + 1);
  });
  return {
    positive,
    support,
    blocks,
    tags: [...tags.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([tag]) => tag),
  };
};

export const demoTodayClassrooms = (user, students, logs, now = new Date()) => {
  const day = now.toLocaleDateString("en-CA");
  const ids = new Set((students || []).map((student) => student.id));
  const dayLogs = (logs || []).filter((log) => ids.has(log.studentId) && logCalendarDate(log) === day);
  return [
    {
      teacherId: user?.id || "demo-teacher",
      name: user?.name || "Teacher",
      title: user?.role || "Teacher",
      ...summarizeToday(dayLogs),
    },
  ];
};

export const normalizeTodayClassrooms = (payload) => {
  const rows = payload?.classrooms || [];
  return rows
    .map((row) => ({
      teacherId: row.teacher_id,
      name: row.teacher_name || "Teacher",
      title: row.teacher_title || "",
      positive: Number(row.positive) || 0,
      support: Number(row.support) || 0,
      blocks: TODAY_BLOCKS.map((label) => {
        const found = (row.blocks || []).find((block) => block.label === label);
        return {
          label,
          positive: Number(found?.positive) || 0,
          support: Number(found?.support) || 0,
        };
      }),
      tags: Array.isArray(row.tags) ? row.tags.filter(Boolean).slice(0, 3) : [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const todayChartSeries = (classrooms) =>
  TODAY_BLOCKS.map((label) =>
    (classrooms || []).reduce(
      (acc, classroom) => {
        const block = (classroom.blocks || []).find((item) => item.label === label);
        return {
          date: label,
          positive: acc.positive + (block?.positive || 0),
          support: acc.support + (block?.support || 0),
        };
      },
      { date: label, positive: 0, support: 0 }
    )
  );

export const todayTotals = (classrooms) =>
  (classrooms || []).reduce(
    (acc, classroom) => ({
      positive: acc.positive + (classroom.positive || 0),
      support: acc.support + (classroom.support || 0),
    }),
    { positive: 0, support: 0 }
  );

export const loadSchoolTodayPulse = async (userId, day) => {
  const membership = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (membership.error) throw new Error(membership.error.message);
  if (!membership.data?.school_id) throw new Error("This account is not linked to a school yet.");

  const pulse = await supabase.rpc("get_school_today_pulse", {
    p_school_id: membership.data.school_id,
    p_day: day,
  });
  if (pulse.error) throw new Error(pulse.error.message);
  return normalizeTodayClassrooms(pulse.data);
};

export const loadSchoolAnalytics = async (userId, cycleStart, cycleEnd) => {
  const membership = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (membership.error) throw new Error(membership.error.message);
  if (!membership.data?.school_id) throw new Error("This account is not linked to a school yet.");

  const analytics = await supabase.rpc("get_school_behavior_analytics", {
    p_school_id: membership.data.school_id,
    p_cycle_start: cycleStart,
    p_cycle_end: cycleEnd,
  });
  if (analytics.error) throw new Error(analytics.error.message);
  return groupAnalyticsRows(analytics.data);
};
