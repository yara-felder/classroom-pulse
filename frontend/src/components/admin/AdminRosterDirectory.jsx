import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { AppSettingsDialog } from "@/components/dialogs/AppSettingsDialog";
import { isSupabaseConfigured } from "@/lib/supabase";
import { demoAdminRoster, filterAdminRoster, loadAdminRoster, teacherOptions } from "@/lib/adminRoster";

const OUTFIT = { fontFamily: "Outfit" };

const PLAN_FILTERS = [
  { id: "all", label: "All" },
  { id: "iep", label: "IEP" },
  { id: "504", label: "504" },
  { id: "none", label: "None" },
];

const planClass = (plan) => {
  if (plan === "IEP & 504") return "bg-indigo-50 text-indigo-800 border-indigo-200";
  if (plan === "IEP") return "bg-indigo-50 text-indigo-800 border-indigo-200";
  if (plan === "504") return "bg-teal-50 text-teal-800 border-teal-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

const PlanBadge = ({ plan }) => (
  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${planClass(plan)}`}>
    {plan}
  </span>
);

export const AdminRosterDirectory = () => {
  const { user } = useAuth();
  const { students } = useClassroom();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [teacherId, setTeacherId] = useState("all");
  const [plan, setPlan] = useState("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = user?.isDemo || !isSupabaseConfigured
          ? demoAdminRoster(students, user)
          : await loadAdminRoster();
        if (!cancelled) setRows(next);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          toast.error(err.message || "Couldn't load the school roster");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, students]);

  const teachers = useMemo(() => teacherOptions(rows), [rows]);
  const visible = useMemo(
    () => filterAdminRoster(rows, { query, teacherId, plan, unassignedOnly }),
    [rows, query, teacherId, plan, unassignedOnly]
  );

  const openAssign = (studentId) => {
    setAssignStudentId(studentId);
    setAssignOpen(true);
  };

  return (
    <div className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="admin-roster">
      <div className="mb-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
          School roster
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.schoolName || "Your school"} · Student, classroom teacher, plan, and who can see the record. Behavior logs, points, and private notes stay with the teacher.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search students or teachers"
            aria-label="Search students or teachers"
            data-testid="admin-roster-search"
            className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="admin-roster-teacher">
            Teacher
          </label>
          <select
            id="admin-roster-teacher"
            aria-label="Filter by teacher"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            data-testid="admin-roster-teacher"
            className="h-8 max-w-full rounded-lg border border-slate-200 bg-white pl-2.5 pr-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">All teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by plan">
            {PLAN_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={plan === item.id}
                onClick={() => setPlan(item.id)}
                data-testid={`admin-roster-plan-${item.id}`}
                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold ${
                  plan === item.id
                    ? "border-teal-500 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={unassignedOnly}
            onClick={() => setUnassignedOnly((current) => !current)}
            data-testid="admin-roster-unassigned"
            className={`h-8 px-2.5 rounded-lg border text-xs font-semibold ${
              unassignedOnly
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Unassigned IEP / 504
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3" data-testid="admin-roster-count">
        {loading ? "Loading the school roster…" : `${visible.length} student${visible.length === 1 ? "" : "s"}`}
      </p>

      {!loading && visible.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="admin-roster-empty">
          No students match this search.
        </p>
      )}

      {visible.length > 0 && (
        <div className="space-y-2" data-testid="admin-roster-list">
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_7rem_minmax(0,1fr)_minmax(0,1.5fr)] gap-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Student</span>
            <span>Classroom teacher</span>
            <span>Plan</span>
            <span>Case manager</span>
            <span>Who has access</span>
          </div>
          {visible.map((row) => (
            <article
              key={row.id}
              data-testid={`admin-roster-row-${row.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_7rem_minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-3"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:hidden">Student</p>
                <p className="text-sm font-bold text-slate-900" style={OUTFIT} data-testid={`admin-roster-name-${row.id}`}>{row.name}</p>
                <p className="text-xs text-slate-500">{row.grade || "Grade not set"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:hidden">Classroom teacher</p>
                <p className="text-sm text-slate-800" data-testid={`admin-roster-teacher-${row.id}`}>{row.teacherName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:hidden">Plan</p>
                <PlanBadge plan={row.plan} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:hidden">Case manager</p>
                {row.caseManagers.length > 0 ? (
                  <p className="text-sm text-slate-800" data-testid={`admin-roster-manager-${row.id}`}>
                    {row.caseManagers.map((person) => person.name).join(", ")}
                  </p>
                ) : row.unassigned ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900"
                      data-testid={`admin-roster-unassigned-${row.id}`}
                    >
                      Not assigned
                    </span>
                    <button
                      type="button"
                      onClick={() => openAssign(row.id)}
                      data-testid={`admin-roster-assign-${row.id}`}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      Assign
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400" data-testid={`admin-roster-manager-${row.id}`}>—</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:hidden">Who has access</p>
                <p className="text-xs text-slate-600 leading-relaxed" data-testid={`admin-roster-access-${row.id}`}>{row.access}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <AppSettingsDialog
        key={assignStudentId || "assign"}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        initialTab="school"
        focusSection="caseload"
        initialStudentId={assignStudentId}
      />
    </div>
  );
};
