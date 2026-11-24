import React, { useMemo, useState } from "react";
import { Search, Mail, GraduationCap, Plus, Shield, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { AddStudentDialog } from "@/components/dialogs/AddStudentDialog";
import { EditStudentDialog } from "@/components/dialogs/EditStudentDialog";
import { EmptyPeriodState } from "@/components/EmptyPeriodState";
import { RestrictedNotice } from "@/components/RestrictedNotice";
import { canEditStudentRecord, namesHidden, visibleClassroomStudents } from "@/lib/rbac";
import { StudentAvatar } from "@/components/StudentAvatar";
import { AdminRosterDirectory } from "@/components/admin/AdminRosterDirectory";
import { CaseManagerWorkspace } from "@/components/case-manager/CaseManagerWorkspace";

export default function RosterPage() {
  const { role } = useClassroom();
  if (role === "admin") return <AdminRosterDirectory />;
  if (role === "case_manager") return <CaseManagerWorkspace />;
  return <TeacherRosterPage />;
}

function TeacherRosterPage() {
  const { students, classSection, can, role, privacySettings } = useClassroom();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const activePeriodName = useMemo(() => {
    const p = (user?.periods || []).find((pd) => pd.id === classSection);
    return p?.name || "";
  }, [user, classSection]);

  const periodStudents = useMemo(
    () => visibleClassroomStudents(role, students, classSection, user?.id),
    [students, classSection, role, user?.id]
  );

  const list = periodStudents.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="pt-6 pb-4 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
            style={{ fontFamily: "Outfit" }}
          >
            Class Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Full class list — search, IEP indicators, and family contact quick links.
          </p>
        </div>
        {can("add_student") && (
        <button
          data-testid="add-student-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2.8} />
          Add Student
        </button>
        )}
      </div>
      {namesHidden(role, privacySettings) && (
        <div className="mt-4">
          <RestrictedNotice role={role} title="Aggregate-only access" body="Your district limits administrators to class-level totals. Student names and profiles are hidden." />
        </div>
      )}

      <div className="relative mt-5 mb-6 max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          data-testid="roster-search-input"
          placeholder="Search roster..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="roster-grid">
        {periodStudents.length === 0 ? (
          namesHidden(role, privacySettings) ? null : <EmptyPeriodState
            testid="roster-empty-period"
            periodName={activePeriodName}
            onAdd={can("add_student") ? () => setAddOpen(true) : undefined}
          />
        ) : (
          list.map((s) => (
          <div
            key={s.id}
            data-testid={`roster-item-${s.id}`}
            className="relative bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow animate-rise"
          >
            <StudentAvatar name={s.name} id={s.id} size="lg" className="ring-2 ring-white" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap pr-9">
                <h3
                  className="text-[15px] font-bold text-slate-900 truncate"
                  style={{ fontFamily: "Outfit" }}
                >
                  {s.name}
                </h3>
                {s.iep && (
                  <Badge
                    data-testid={`roster-iep-${s.id}`}
                    className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-bold"
                  >
                    IEP
                  </Badge>
                )}
                {s.plan504 && (
                  <Badge
                    data-testid={`roster-504-${s.id}`}
                    className="bg-teal-100 text-teal-700 border-teal-200 text-[10px] font-bold"
                  >
                    <Shield className="w-2.5 h-2.5 mr-0.5" /> 504
                  </Badge>
                )}
              </div>
              {s.grade ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="truncate">{s.grade}</span>
                </div>
              ) : null}
              {s.guardianEmail ? (
                <a
                  href={`mailto:${s.guardianEmail}`}
                  className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 mt-1.5 font-medium"
                  data-testid={`roster-email-${s.id}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{s.guardianEmail}</span>
                </a>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 font-medium"
                  data-testid={`roster-email-${s.id}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">No guardian email</span>
                </span>
              )}
            </div>
            <div className="flex flex-col items-center bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 shrink-0">
              <span className="text-[9px] font-bold uppercase text-emerald-600">Pts</span>
              <span
                className="text-lg font-extrabold text-emerald-700 leading-none"
                style={{ fontFamily: "Fredoka" }}
              >
                {s.points}
              </span>
            </div>
            {canEditStudentRecord(role, s, user?.id) && (
            <button
              data-testid={`roster-edit-btn-${s.id}`}
              onClick={() => setEditingStudent(s)}
              aria-label={`Edit ${s.name}`}
              title="Edit student"
              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50 flex items-center justify-center shadow-sm transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            )}
          </div>
          ))
        )}
      </div>

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditStudentDialog
        open={!!editingStudent}
        onOpenChange={(v) => !v && setEditingStudent(null)}
        student={editingStudent}
      />
    </div>
  );
}
