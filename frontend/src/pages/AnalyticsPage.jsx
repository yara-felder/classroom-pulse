import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Sparkles, AlertTriangle, TrendingUp, Target, Settings } from "lucide-react";
import { useClassroom } from "@/context/ClassroomContext";
import { StudentAnalyticsSheet } from "@/components/StudentAnalyticsSheet";
import { ClassGoalBanner, useClassGoal } from "@/components/ClassGoalBanner";
import { CycleHeader } from "@/components/analytics/CycleHeader";
import { RecentCelebrations } from "@/components/analytics/RecentCelebrations";
import { ProgressDistribution } from "@/components/analytics/ProgressDistribution";
import { AppSettingsDialog } from "@/components/dialogs/AppSettingsDialog";
import { cycleBounds, sumRange, thisWeekSeries } from "@/lib/pointCycle";
import { buildCelebrations, studentStatusGroup } from "@/lib/celebrations";
import { namesHidden } from "@/lib/rbac";
import { AdminBehaviorAnalytics } from "@/components/analytics/AdminBehaviorAnalytics";

const CHART_MARGIN = { top: 6, right: 8, left: 0, bottom: 24 };
const TOOLTIP_STYLE = { background: "white", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12 };
const LEGEND_STYLE = { fontSize: 12, paddingTop: 16 };
const BAR_RADIUS = [6, 6, 0, 0];

export default function AnalyticsPage() {
  const classroom = useClassroom();
  if (classroom.role === "admin") return <AdminBehaviorAnalytics />;
  return <TeacherBehaviorAnalytics classroom={classroom} />;
}

function TeacherBehaviorAnalytics({ classroom }) {
  const { students, logs, classSection, pointSettings, skillsByStudent, iepGoalsByStudent, markChecklist, role, privacySettings, can } = classroom;
  useEffect(() => {
    markChecklist("goal");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mark the checklist step once on first visit
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Only include students in the currently-active period so Home, Roster,
  // and Analytics stay in sync on the exact same slice.
  const periodStudents = useMemo(
    () =>
      students.filter((s) => {
        const ids = s.periodIds && s.periodIds.length > 0 ? s.periodIds : s.periodId ? [s.periodId] : [];
        return ids.includes(classSection);
      }),
    [students, classSection]
  );
  const named = role === "case_manager" ? periodStudents.filter((s) => s.iep || s.plan504) : periodStudents;
  const hideNames = namesHidden(role, privacySettings);

  const stats = useMemo(() => {
    const b = cycleBounds(pointSettings);
    const { positive, support } = sumRange(periodStudents, logs, b.start, b.end);
    const ratio = positive + support === 0 ? 100 : Math.round((positive / (positive + support)) * 100);
    return { positive, support, ratio };
  }, [logs, periodStudents, pointSettings]);

  const goal = useClassGoal(periodStudents);

  const trend = useMemo(() => thisWeekSeries(periodStudents, logs), [logs, periodStudents]);

  const celebrations = useMemo(
    () => buildCelebrations(hideNames ? [] : named, skillsByStudent, iepGoalsByStudent),
    [named, hideNames, skillsByStudent, iepGoalsByStudent]
  );

  const groups = useMemo(() => {
    const out = {};
    [...named]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((s) => {
        const g = studentStatusGroup(s, skillsByStudent[s.id], iepGoalsByStudent[s.id], logs, cycleBounds(pointSettings));
        (out[g] = out[g] || []).push(s);
      });
    return out;
  }, [named, skillsByStudent, iepGoalsByStudent, logs, pointSettings]);

  const openStudent = (s) => {
    setSelectedStudent(s);
    setSheetOpen(true);
  };

  return (
    <div className="pt-6 pb-4 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
            style={{ fontFamily: "Outfit" }}
          >
            Behavior Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekday-only trends across the class. Tap a student for their history.
          </p>
          <div className="mt-3">
            <CycleHeader />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-stretch gap-2">
        <div className="flex-1">
          <ClassGoalBanner periodStudents={periodStudents} testid="analytics-class-goal" />
        </div>
        {can("settings") && (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="shrink-0 w-11 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center transition-colors"
          aria-label="Point system settings"
          data-testid="open-point-settings-btn"
        >
          <Settings className="w-4 h-4" />
        </button>
        )}
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Positive Logs</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "Fredoka" }}>
            {stats.positive}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Support Logs</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "Fredoka" }}>
            {stats.support}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-teal-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Positive Ratio</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "Fredoka" }}>
            {stats.ratio}%
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <Target className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Class Goal</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "Fredoka" }} data-testid="stat-class-goal-pct">
            {goal.pct}%
          </div>
          <div className="text-xs text-slate-500">{goal.progress} of {goal.target} moments</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div
          className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-2"
          data-testid="chart-weekly-trend"
        >
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
            Weekly trend · {trend[0].date} to {trend[trend.length - 1].date}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Positive vs Support · Weekdays only
          </p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} barGap={4} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  data-testid="weekly-trend-xaxis"
                />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="positive" name="Positive" fill="#10B981" radius={BAR_RADIUS} />
                <Bar dataKey="support" name="Support" fill="#F59E0B" radius={BAR_RADIUS} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <RecentCelebrations items={celebrations} onOpenStudent={openStudent} />
      </div>

      <ProgressDistribution groups={groups} onOpenStudent={openStudent} hideNames={hideNames} />

      <StudentAnalyticsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        student={selectedStudent}
      />
      <AppSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} initialTab="points" />
    </div>
  );
}
