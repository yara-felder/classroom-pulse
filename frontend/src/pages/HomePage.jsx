import React, { useMemo, useState } from "react";
import { Search, Sparkles, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StudentCard } from "@/components/StudentCard";
import { EmptyPeriodState } from "@/components/EmptyPeriodState";
import { AddStudentDialog } from "@/components/dialogs/AddStudentDialog";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { ClassGoalBanner } from "@/components/ClassGoalBanner";
import { GettingStartedCard } from "@/components/GettingStartedCard";
import { RestrictedNotice } from "@/components/RestrictedNotice";
import { scopeStudents, namesHidden } from "@/lib/rbac";

const FILTERS = [
  { id: "all", label: "All Students" },
  { id: "positive", label: "Positive Streak" },
  { id: "support", label: "Needs Check-In" },
  { id: "az", label: "A → Z" },
];

const TONES = {
  slate: { bg: "bg-white", border: "border-slate-200", iconBg: "bg-slate-100", icon: "text-slate-700", text: "text-slate-900" },
  emerald: { bg: "bg-emerald-50/60", border: "border-emerald-200", iconBg: "bg-emerald-100", icon: "text-emerald-700", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50/60", border: "border-amber-200", iconBg: "bg-amber-100", icon: "text-amber-700", text: "text-amber-700" },
  teal: { bg: "bg-teal-50/60", border: "border-teal-200", iconBg: "bg-teal-100", icon: "text-teal-700", text: "text-teal-700" },
};

const FREDOKA = { fontFamily: "Fredoka" };
const OUTFIT = { fontFamily: "Outfit" };

const StatPill = ({ icon: Icon, label, value, tone, testid }) => (
  <div
    data-testid={testid}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${tone.bg} ${tone.border}`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone.iconBg}`}>
      <Icon className={`w-4 h-4 ${tone.icon}`} />
    </div>
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span
        className={`text-xl font-extrabold ${tone.text}`}
        style={FREDOKA}
      >
        {value}
      </span>
    </div>
  </div>
);

export default function HomePage() {
  const { students, logs, classSection, can, role, privacySettings } = useClassroom();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const activePeriodName = useMemo(() => {
    const p = (user?.periods || []).find((pd) => pd.id === classSection);
    return p?.name || "";
  }, [user, classSection]);

  const periodStudents = useMemo(
    () =>
      scopeStudents(role, students, privacySettings).filter((s) => {
        const ids = s.periodIds && s.periodIds.length > 0 ? s.periodIds : s.periodId ? [s.periodId] : [];
        return ids.includes(classSection);
      }),
    [students, classSection, role, privacySettings]
  );

  const totals = useMemo(() => {
    const idsInPeriod = new Set(periodStudents.map((s) => s.id));
    const positive = logs.filter((l) => l.type === "positive" && idsInPeriod.has(l.studentId)).length;
    const support = logs.filter((l) => l.type === "support" && idsInPeriod.has(l.studentId)).length;
    const totalPoints = periodStudents.reduce((sum, s) => sum + s.points, 0);
    return { positive, support, totalPoints };
  }, [logs, periodStudents]);

  const visibleStudents = useMemo(() => {
    let list = periodStudents.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === "positive") list = [...list].sort((a, b) => b.points - a.points);
    else if (filter === "support") list = list.filter((s) => s.supportCount > 0).sort((a, b) => b.supportCount - a.supportCount);
    else if (filter === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [periodStudents, search, filter]);

  return (
    <div className="pt-6">
      {/* Class Summary */}
      <div
        data-testid="class-summary-bar"
        className="px-4 sm:px-8 max-w-7xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
              style={OUTFIT}
            >
              Today&apos;s classroom pulse
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tap a card to celebrate, support, or log a moment — in seconds.
            </p>
          </div>
        </div>

        {namesHidden(role, privacySettings) && (
          <RestrictedNotice role={role} title="Aggregate-only access" body="Your district limits administrators to class-level analytics. Open the Analytics tab for building-level trends." />
        )}
        {role === "case_manager" && (
          <RestrictedNotice role={role} title="Your caseload" body="Showing students with IEP or 504 plans. Open a profile to log IEP goal trials." testid="caseload-notice" />
        )}
        {can("log") && <GettingStartedCard periodStudents={periodStudents} />}

        {periodStudents.length > 0 && (
          <div className="mb-4">
            <ClassGoalBanner periodStudents={periodStudents} testid="home-class-goal" />
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatPill
            testid="stat-students"
            icon={Users}
            label="Students"
            value={periodStudents.length}
            tone={TONES.slate}
          />
          <StatPill
            testid="stat-positive-today"
            icon={Sparkles}
            label="Positive Today"
            value={totals.positive}
            tone={TONES.emerald}
          />
          <StatPill
            testid="stat-support-today"
            icon={AlertTriangle}
            label="Support Today"
            value={totals.support}
            tone={TONES.amber}
          />
          <StatPill
            testid="stat-points-total"
            icon={TrendingUp}
            label="Class Points"
            value={totals.totalPoints}
            tone={TONES.teal}
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              data-testid="student-search-input"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 rounded-xl h-11"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                data-testid={`filter-${f.id}`}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  filter === f.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Grid */}
      <div
        data-testid="student-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 px-4 sm:px-8 max-w-7xl mx-auto"
      >
        {periodStudents.length === 0 ? (
          namesHidden(role, privacySettings) ? null : <EmptyPeriodState
            testid="home-empty-period"
            periodName={activePeriodName}
            onAdd={can("add_student") ? () => setAddOpen(true) : undefined}
          />
        ) : (
          <>
            {visibleStudents.map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
            {visibleStudents.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400 text-sm">
                No students match your filters.
              </div>
            )}
          </>
        )}
      </div>
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
