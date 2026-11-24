import React, { useMemo, useState } from "react";
import { Layers, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/dialogs/AddStudentDialog";
import { ManagePeriodsDialog } from "@/components/dialogs/ManagePeriodsDialog";
import { assignedCaseloadStudents, ownPeriodStudents } from "@/lib/rbac";
import { planLabel } from "@/lib/adminRoster";

const OUTFIT = { fontFamily: "Outfit" };

const decorate = (student) => {
  if (!student.assigned && !student.ownerId && (student.iep || student.plan504)) {
    return { ...student, assigned: true, teacherName: student.teacherName || "Classroom teacher" };
  }
  return student;
};

export const CaseManagerWorkspace = () => {
  const { user } = useAuth();
  const { students, classSection, setPullout } = useClassroom();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [periodsOpen, setPeriodsOpen] = useState(false);

  const periodName = (user?.periods || []).find((period) => period.id === classSection)?.name || "this period";
  const roster = useMemo(() => students.map(decorate), [students]);
  const q = query.trim().toLowerCase();
  const matches = (student) =>
    !q
    || student.name.toLowerCase().includes(q)
    || (student.teacherName || "").toLowerCase().includes(q);

  const caseload = assignedCaseloadStudents(roster).filter(matches);
  const mine = ownPeriodStudents(roster, classSection, user?.id).filter(matches);

  const togglePlacement = (student) => {
    if (!classSection) return;
    const placed = (student.pulloutPeriodIds || []).includes(classSection);
    setPullout(student.id, classSection, !placed);
  };

  return (
    <div className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="case-manager-workspace">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
          Case manager
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Assigned students stay separate from the periods and groups you create.
        </p>
      </div>

      <div className="relative max-w-lg mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students or teachers"
          aria-label="Search students or teachers"
          data-testid="case-manager-search"
          className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
        />
      </div>

      <section className="mb-8" data-testid="assigned-caseload">
        <h2 className="text-xl font-extrabold text-slate-900" style={OUTFIT}>Assigned caseload</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          IEP and 504 students an administrator assigned to you. Private staff notes stay with the classroom teacher.
        </p>
        {caseload.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="assigned-caseload-empty">No students are assigned to you yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {caseload.map((student) => {
              const placed = (student.pulloutPeriodIds || []).includes(classSection);
              return (
                <div key={student.id} data-testid={`caseload-card-${student.id}`}>
                  <StudentCard student={student} />
                  <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <span className="text-[11px] font-bold text-indigo-700" data-testid={`caseload-plan-${student.id}`}>
                      {planLabel(student.iep, student.plan504)}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePlacement(student)}
                      disabled={!classSection}
                      data-testid={`caseload-place-${student.id}`}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 disabled:opacity-40"
                    >
                      {placed ? `Remove from ${periodName}` : `Add to ${periodName}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section data-testid="my-periods">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900" style={OUTFIT}>My periods / groups</h2>
            <p className="text-sm text-slate-500 mt-1">
              {periodName}. Add a student here, or include someone from the assigned caseload.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPeriodsOpen(true)}
              data-testid="case-manager-manage-periods"
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 hover:border-teal-300"
            >
              <Layers className="w-4 h-4" /> Manage periods
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              data-testid="add-student-btn"
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-3 py-2.5"
            >
              <Plus className="w-4 h-4" /> Add student
            </button>
          </div>
        </div>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="my-periods-empty">
            No students are in {periodName} yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map((student) => (
              <div key={student.id} data-testid={`my-period-card-${student.id}`}>
                <StudentCard student={student} />
                {student.assigned && (
                  <button
                    type="button"
                    onClick={() => togglePlacement(student)}
                    data-testid={`my-period-remove-${student.id}`}
                    className="mt-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Remove from {periodName}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <ManagePeriodsDialog open={periodsOpen} onOpenChange={setPeriodsOpen} />
    </div>
  );
};
