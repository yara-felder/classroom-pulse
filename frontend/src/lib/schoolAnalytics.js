import { addDays, format, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { countLogsOnDay, weekdayBounds } from "@/lib/pointCycle";

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
