import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { StudentCard } from "@/components/StudentCard";
import { StudentAnalyticsSheet } from "@/components/StudentAnalyticsSheet";
import { assignedCaseloadStudents, decorateCaseloadStudent, isOwnStudent, ownPeriodStudents } from "@/lib/rbac";
import { planLabel } from "@/lib/adminRoster";

const OUTFIT = { fontFamily: "Outfit" };

export const CaseManagerHome = () => {
  const { user } = useAuth();
  const { students, logs, classSection } = useClassroom();
  const [trendsStudent, setTrendsStudent] = useState(null);
  const periodName = (user?.periods || []).find((period) => period.id === classSection)?.name || "this period";
  const roster = useMemo(() => students.map(decorateCaseloadStudent), [students]);
  const mine = ownPeriodStudents(roster, classSection, user?.id).filter((student) => isOwnStudent(student, user?.id));
  const caseload = assignedCaseloadStudents(roster);

  const latestTag = (studentId) => {
    const recent = logs
      .filter((log) => log.studentId === studentId && !log.notePrivate && (log.type === "positive" || log.type === "support"))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    return recent?.tag || "No behavior logged yet";
  };

  return (
    <div className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="case-manager-home">
      <div className="mb-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
          Today&apos;s groups
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Use the period selector to log {periodName}. Assigned students stay in the strip below.
        </p>
      </div>

      <section data-testid="my-periods">
        <h2 className="text-xl font-extrabold text-slate-900" style={OUTFIT}>{periodName}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Quick behavior logging for students in this group.</p>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="my-periods-empty">
            No students are in {periodName} yet. Add them from Roster.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map((student) => (
              <div key={student.id} data-testid={`my-period-card-${student.id}`}>
                <StudentCard student={student} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8" data-testid="assigned-caseload">
        <h2 className="text-xl font-extrabold text-slate-900" style={OUTFIT}>Assigned caseload</h2>
        <p className="text-sm text-slate-500 mt-1 mb-3">
          IEP and 504 students assigned to you. Private notes stay with the classroom teacher.
        </p>
        {caseload.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="assigned-caseload-empty">No students are assigned to you yet.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2" data-testid="assigned-caseload-strip">
            {caseload.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setTrendsStudent(student)}
                data-testid={`caseload-strip-${student.id}`}
                className="shrink-0 w-64 text-left bg-white border border-slate-200 rounded-2xl px-3 py-3 hover:border-teal-300"
              >
                <p className="text-sm font-bold text-slate-900 truncate" style={OUTFIT}>{student.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {[student.grade, student.teacherName || "Classroom teacher"].filter(Boolean).join(" · ")}
                </p>
                <p className="text-[11px] font-bold text-indigo-700 mt-1" data-testid={`caseload-plan-${student.id}`}>
                  {planLabel(student.iep, student.plan504)}
                </p>
                <p className="text-xs text-slate-600 mt-1 truncate">{latestTag(student.id)}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <StudentAnalyticsSheet
        open={!!trendsStudent}
        onOpenChange={(open) => !open && setTrendsStudent(null)}
        student={trendsStudent}
      />
    </div>
  );
};
