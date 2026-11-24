import React, { useEffect, useState } from "react";
import { Building2, ClipboardList, FileText, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { AppSettingsDialog } from "@/components/dialogs/AppSettingsDialog";
import { demoSchoolHome, loadSchoolHomeLists } from "@/lib/adminRoster";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const OUTFIT = { fontFamily: "Outfit" };
const FREDOKA = { fontFamily: "Fredoka" };

const Metric = ({ icon: Icon, label, value, hint, testid }) => (
  <div data-testid={testid} className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-2 text-slate-500">
      <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="mt-3 text-3xl font-extrabold text-slate-900" style={FREDOKA}>
      {value}
    </p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </div>
);

const firstRow = (data) => (Array.isArray(data) ? data[0] : data);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { students } = useClassroom();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusSection, setFocusSection] = useState("invites");
  const [assignStudentId, setAssignStudentId] = useState("");
  const [live, setLive] = useState(null);
  const [lists, setLists] = useState({ staff: [], caseload: [] });
  const [listsState, setListsState] = useState("loading");

  const localIep = students.filter((student) => student.iep || student.plan504).length;

  useEffect(() => {
    let cancelled = false;
    if (user?.isDemo || !isSupabaseConfigured || !supabase) {
      setLists(demoSchoolHome(students, user));
      setListsState("ready");
      return undefined;
    }
    setListsState("loading");
    (async () => {
      const [overviewRes, directoryRes, homeLists] = await Promise.all([
        supabase.rpc("admin_school_overview"),
        supabase.rpc("school_directory"),
        loadSchoolHomeLists().catch((err) => {
          if (!cancelled) setListsState(err.message || "error");
          return null;
        }),
      ]);
      if (cancelled) return;
      if (!overviewRes.error) {
        const overview = firstRow(overviewRes.data);
        const directory = directoryRes.error ? [] : directoryRes.data || [];
        if (overview) {
          setLive({
            teachers: directory.filter((person) => person.access_role === "teacher").length,
            students: Number(overview.student_count) || 0,
            iep: Number(overview.iep_or_504_student_count) || 0,
          });
        }
      }
      if (homeLists) {
        setLists(homeLists);
        setListsState("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, students]);

  const metrics = live || {
    teachers: user?.isDemo ? 1 : "—",
    students: user?.isDemo ? students.length : "—",
    iep: user?.isDemo ? localIep : "—",
  };

  const openSection = (section, studentId = "") => {
    setAssignStudentId(studentId);
    setFocusSection(section);
    setSettingsOpen(true);
  };

  return (
    <div className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="admin-dashboard">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
          School overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.schoolName || "Your school"} · The school roster, including student names, is available for caseload assignment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Metric
          testid="admin-metric-teachers"
          icon={Users}
          label="Teachers"
          value={metrics.teachers}
          hint="Staff teaching at this school"
        />
        <Metric
          testid="admin-metric-students"
          icon={Building2}
          label="Active students"
          value={metrics.students}
          hint="School-wide count. Names are on the school roster."
        />
        <Metric
          testid="admin-metric-iep"
          icon={FileText}
          label="IEP reports"
          value={metrics.iep}
          hint="Students with an IEP or 504 plan"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          data-testid="admin-open-invites"
          onClick={() => openSection("invites")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-teal-300 transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </span>
          <span className="mt-3 block text-sm font-bold text-slate-900" style={OUTFIT}>Staff invites</span>
          <span className="mt-1 block text-xs text-slate-500">Create a code for a teacher or case manager.</span>
        </button>
        <button
          type="button"
          data-testid="admin-open-caseload"
          onClick={() => openSection("caseload")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-teal-300 transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </span>
          <span className="mt-3 block text-sm font-bold text-slate-900" style={OUTFIT}>Caseload assignments</span>
          <span className="mt-1 block text-xs text-slate-500">Match an IEP or 504 student with a case manager.</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3" data-testid="admin-school-summary">
        <section data-testid="admin-staff-panel" className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900" style={OUTFIT}>School staff</h2>
              <p className="text-xs text-slate-500 mt-0.5">Teachers and case managers at this school.</p>
            </div>
            <button
              type="button"
              onClick={() => openSection("invites")}
              data-testid="admin-manage-invites"
              className="shrink-0 text-xs font-semibold text-slate-500 hover:text-teal-700"
            >
              Manage invites
            </button>
          </div>
          {listsState === "loading" ? (
            <p className="text-sm text-slate-500">Loading staff…</p>
          ) : listsState !== "ready" ? (
            <p className="text-sm text-slate-500">Staff list is unavailable right now.</p>
          ) : lists.staff.length === 0 ? (
            <p className="text-sm text-slate-500" data-testid="admin-staff-empty">No teachers or case managers have joined yet.</p>
          ) : (
            <ul className="space-y-2">
              {lists.staff.map((person) => (
                <li
                  key={person.id}
                  data-testid={`admin-staff-${person.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.countLabel}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                      person.role === "case_manager"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-teal-50 text-teal-800 border-teal-200"
                    }`}
                  >
                    {person.roleLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section data-testid="admin-caseload-panel" className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900" style={OUTFIT}>Current caseload assignments</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-3">IEP and 504 students and the case manager assigned to each.</p>
          {listsState === "loading" ? (
            <p className="text-sm text-slate-500">Loading assignments…</p>
          ) : listsState !== "ready" ? (
            <p className="text-sm text-slate-500">Caseload list is unavailable right now.</p>
          ) : lists.caseload.length === 0 ? (
            <p className="text-sm text-slate-500" data-testid="admin-caseload-empty">No IEP or 504 students are on the school roster yet.</p>
          ) : (
            <ul className="space-y-2">
              {lists.caseload.map((student) => (
                <li
                  key={student.id}
                  data-testid={`admin-caseload-${student.id}`}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                    student.unassigned ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {student.name}{" "}
                      <span className="font-bold text-indigo-700">({student.plan})</span>
                    </p>
                    {student.unassigned ? (
                      <p className="text-xs font-semibold text-amber-800" data-testid={`admin-caseload-unassigned-${student.id}`}>
                        Not assigned
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 truncate" data-testid={`admin-caseload-manager-${student.id}`}>
                        {student.managerName}
                      </p>
                    )}
                  </div>
                  {student.unassigned && (
                    <button
                      type="button"
                      onClick={() => openSection("caseload", student.id)}
                      data-testid={`admin-caseload-assign-${student.id}`}
                      className="shrink-0 text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      Assign
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <AppSettingsDialog
        key={`${focusSection}-${assignStudentId}`}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab="school"
        focusSection={focusSection}
        initialStudentId={assignStudentId}
      />
    </div>
  );
};
