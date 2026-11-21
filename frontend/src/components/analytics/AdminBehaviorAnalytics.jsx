import React, { useEffect, useMemo, useState } from "react";
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
import { addDays, format } from "date-fns";
import { AlertTriangle, School, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { CycleHeader } from "@/components/analytics/CycleHeader";
import { WeekNavigator } from "@/components/analytics/WeekNavigator";
import { earliestLogIso, minWeekOffsetForDate, weekdayBounds } from "@/lib/pointCycle";
import {
  chartSeries,
  currentWeekdays,
  demoClassrooms,
  loadSchoolAnalytics,
  loadSchoolEarliestLogDate,
  ratioOf,
  sumDays,
} from "@/lib/schoolAnalytics";

const CHART_MARGIN = { top: 6, right: 8, left: 0, bottom: 24 };
const TOOLTIP_STYLE = { background: "white", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12 };
const LEGEND_STYLE = { fontSize: 12, paddingTop: 16 };
const BAR_RADIUS = [6, 6, 0, 0];
const OUTFIT = { fontFamily: "Outfit" };
const FREDOKA = { fontFamily: "Fredoka" };

const Kpi = ({ icon: Icon, label, value, tone, testid }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4" data-testid={testid}>
    <div className={`flex items-center gap-2 ${tone}`}>
      <Icon className="w-4 h-4" />
      <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-3xl font-extrabold text-slate-900 mt-1" style={FREDOKA}>
      {value}
    </div>
  </div>
);

const WeekBar = ({ days, testid = "classroom-week-bar" }) => {
  const max = Math.max(1, ...days.map((day) => day.positive + day.support));
  return (
    <div className="flex items-end gap-1 h-10" data-testid={testid}>
      {days.map((day) => {
        const total = day.positive + day.support;
        const height = Math.max(8, Math.round((total / max) * 100));
        const positiveShare = total ? (day.positive / total) * 100 : 0;
        return (
          <div key={day.weekday} className="flex-1 h-full flex flex-col justify-end" title={`${day.label}: ${day.positive} positive, ${day.support} support`}>
            <div className="w-full rounded-sm overflow-hidden flex flex-col justify-end bg-slate-100" style={{ height: `${height}%` }}>
              <div className="bg-amber-400" style={{ height: `${100 - positiveShare}%` }} />
              <div className="bg-emerald-500" style={{ height: `${positiveShare}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AdminBehaviorAnalytics = () => {
  const { user } = useAuth();
  const { students, logs } = useClassroom();
  const [weekOffset, setWeekOffset] = useState(0);
  const [schoolEarliestIso, setSchoolEarliestIso] = useState(null);
  const week = useMemo(() => weekdayBounds(weekOffset), [weekOffset]);
  const earliestIso = user?.isDemo ? earliestLogIso(logs) : schoolEarliestIso;
  const minWeekOffset = useMemo(() => minWeekOffsetForDate(earliestIso), [earliestIso]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedId, setSelectedId] = useState("all");
  const [status, setStatus] = useState(user?.isDemo ? "ready" : "loading");

  useEffect(() => {
    if (!user?.id || user.isDemo) return undefined;
    let cancelled = false;
    loadSchoolEarliestLogDate(user.id).then((iso) => {
      if (!cancelled) setSchoolEarliestIso(iso);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) return undefined;
    if (user.isDemo) {
      setClassrooms(demoClassrooms(user, students, logs, weekOffset));
      setStatus("ready");
      return undefined;
    }
    let cancelled = false;
    setStatus("loading");
    loadSchoolAnalytics(user.id, week.startIso, week.endIso)
      .then((rows) => {
        if (cancelled) return;
        setClassrooms(rows);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setClassrooms([]);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user, week.startIso, week.endIso, weekOffset, students, logs]);

  useEffect(() => {
    if (selectedId !== "all" && !classrooms.some((classroom) => classroom.teacherId === selectedId)) {
      setSelectedId("all");
    }
  }, [classrooms, selectedId]);

  const visible = selectedId === "all" ? classrooms : classrooms.filter((classroom) => classroom.teacherId === selectedId);
  const totals = sumDays(visible.flatMap((classroom) => classroom.days));
  const trend = chartSeries(visible);
  const emptyWeek = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(week.start, offset);
    return { date: format(date, "MM/dd"), positive: 0, support: 0 };
  });
  const chart = trend.length ? trend : emptyWeek;

  return (
    <div className="pt-6 pb-4 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="admin-behavior-analytics">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
          Behavior Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">School-wide weekday trends across linked classrooms.</p>
        <div className="mt-3">
          <CycleHeader />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Kpi testid="admin-kpi-positive" icon={Sparkles} label="Positive Logs" value={totals.positive} tone="text-emerald-700" />
        <Kpi testid="admin-kpi-support" icon={AlertTriangle} label="Support Logs" value={totals.support} tone="text-amber-700" />
        <Kpi testid="admin-kpi-ratio" icon={TrendingUp} label="Positive Ratio" value={`${ratioOf(totals.positive, totals.support)}%`} tone="text-teal-700" />
        <Kpi testid="admin-kpi-classrooms" icon={School} label="Active Classrooms" value={visible.length} tone="text-indigo-700" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-5" data-testid="chart-weekly-trend">
        <div className="flex gap-1.5 overflow-x-auto pb-1" data-testid="classroom-filter">
          <FilterPill active={selectedId === "all"} onClick={() => setSelectedId("all")} testid="classroom-filter-all">
            All Classrooms
          </FilterPill>
          {classrooms.map((classroom) => (
            <FilterPill
              key={classroom.teacherId}
              active={selectedId === classroom.teacherId}
              onClick={() => setSelectedId(classroom.teacherId)}
              testid={`classroom-filter-${classroom.teacherId}`}
            >
              {classroom.name}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <h3 className="text-base font-bold text-slate-900" style={OUTFIT} data-testid="weekly-trend-range">
            Weekly trend
          </h3>
          <WeekNavigator weekOffset={weekOffset} minWeekOffset={minWeekOffset} onChange={setWeekOffset} />
        </div>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Positive vs Support · Weekdays only</p>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} barGap={4} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} />
              <Bar dataKey="positive" name="Positive" fill="#10B981" radius={BAR_RADIUS} />
              <Bar dataKey="support" name="Support" fill="#F59E0B" radius={BAR_RADIUS} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-5" data-testid="classroom-trends">
        <h3 className="text-base font-bold text-slate-900" style={OUTFIT}>
          Weekly Trends by Classroom
        </h3>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          Counts only. Student names stay with each teacher.
        </p>
        {status === "loading" && <p className="text-sm text-slate-500 mt-4">Loading classrooms…</p>}
        {status === "error" && (
          <p className="text-sm text-slate-500 mt-4" data-testid="classroom-trends-error">
            School totals appear after the school database update is applied.
          </p>
        )}
        {status === "ready" && classrooms.length === 0 && (
          <p className="text-sm text-slate-500 mt-4">No classrooms are linked to this school yet.</p>
        )}
        <ul className="mt-4 space-y-2">
          {classrooms.map((classroom) => {
            const cycle = sumDays(classroom.days);
            const ratio = ratioOf(cycle.positive, cycle.support);
            const active = selectedId === classroom.teacherId;
            return (
              <li key={classroom.teacherId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(classroom.teacherId)}
                  data-testid={`classroom-trend-${classroom.teacherId}`}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${active ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate" style={OUTFIT}>{classroom.name}</p>
                      {classroom.title && <p className="text-[11px] text-slate-500 truncate">{classroom.title}</p>}
                      <p className="text-xs text-slate-600 mt-1">
                        {cycle.positive} positive · {cycle.support} support
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold rounded-full bg-teal-50 text-teal-800 border border-teal-200 px-2 py-1" data-testid={`classroom-ratio-${classroom.teacherId}`}>
                      {ratio}%
                    </span>
                  </div>
                  <div className="mt-3">
                    <WeekBar days={currentWeekdays(classroom.days)} testid={`classroom-week-bar-${classroom.teacherId}`} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const FilterPill = ({ active, onClick, testid, children }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
      active ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
    }`}
  >
    {children}
  </button>
);
