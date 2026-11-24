import React, { useEffect, useState } from "react";
import { Building2, ClipboardList, FileText, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { AppSettingsDialog } from "@/components/dialogs/AppSettingsDialog";
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
  const [live, setLive] = useState(null);

  const localIep = students.filter((student) => student.iep || student.plan504).length;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || user?.isDemo) return undefined;
    let cancelled = false;
    (async () => {
      const [overviewRes, directoryRes] = await Promise.all([
        supabase.rpc("admin_school_overview"),
        supabase.rpc("school_directory"),
      ]);
      if (cancelled || overviewRes.error) return;
      const overview = firstRow(overviewRes.data);
      if (!overview) return;
      const directory = directoryRes.error ? [] : directoryRes.data || [];
      setLive({
        teachers: directory.filter((person) => person.access_role === "teacher").length,
        students: Number(overview.student_count) || 0,
        iep: Number(overview.iep_or_504_student_count) || 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.isDemo]);

  const metrics = live || {
    teachers: user?.isDemo ? 1 : "—",
    students: user?.isDemo ? students.length : "—",
    iep: user?.isDemo ? localIep : "—",
  };

  const openSection = (section) => {
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

      <AppSettingsDialog
        key={focusSection}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab="school"
        focusSection={focusSection}
      />
    </div>
  );
};
